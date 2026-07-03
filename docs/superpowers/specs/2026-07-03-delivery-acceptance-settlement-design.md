# 交付、算法验收与代标结算设计

## 背景

当前平台已经支持以下基础能力：

- 项目、批次、任务的创建与浏览
- 任务按题目粒度进行录入与批量导入
- 任务分配给标注员
- 浏览器与后端端到端测试覆盖项目、批次、任务、分配主链路

但平台尚未把以下生产级流程抽象为可追踪的领域对象：

- 题目级质检
- 批次级正式交付
- 算法侧抽检与验收决策
- 标注员离项后的代标流转
- 按题核算下的人工结算裁定

本设计的目标是在不推倒现有主干的前提下，以增量扩展的方式补齐上述能力，并保持后续可继续扩角色、报表、权限和智能体辅助。

## 目标

本次设计覆盖以下目标：

1. 让批次交付与算法验收成为独立、可追踪的业务对象。
2. 让题目级质检与算法抽检都有完整痕迹。
3. 支持标注员离项后由其他人代标，并保留完整流转链。
4. 支持按题核算下的人工裁定，允许一道题按执行流转拆分归属。
5. 保持现有项目页、批次页、任务页的主结构不被推翻，按增量方式接入。

## 非目标

本次设计不覆盖以下内容：

- 完整登录体系与组织架构系统接入
- 复杂 RBAC 引擎
- 自动化薪酬结算
- 多租户隔离
- 算法平台外部系统的真实回调集成

## 关键业务结论

根据本轮确认，以下口径已经固定：

1. 采用标准版模型，不把质检、交付、算法验收继续揉在 `TaskAssignment` 内。
2. 正式验收对象以批次为主，算法可对批次内样本题进行抽检。
3. 算法验收支持三种结果：通过、部分驳回、整批驳回。
4. 标注人员离项后支持代标，执行链需要完整追踪。
5. 代标后的产量归属支持按流转记录拆分，并允许人工裁定。
6. 首版结算裁定权归 `项目经理 + 运营`。

## 推荐方案

推荐在现有 `Project / Batch / TaskItem / TaskAssignment` 主干上做增量扩表。

原因如下：

- 现有任务创建、导入、分配链路已经可用，重构成本不必要地高。
- 交付、验收、代标、结算都是新增业务维度，天然适合拆成独立对象。
- 未来如果需要做抽检报表、返修率、交付 SLA、代标争议分析，独立对象更容易扩展。

不推荐把所有行为统一抽象成一个“事件流大表”，因为当前阶段会显著放大开发与维护风险。

## 领域模型

### 保留并扩展的现有对象

#### `TaskItem`

继续作为最小核算单元，一题一条。

职责：

- 保存题目内容与当前生产状态
- 关联执行流转、质检记录、抽检记录与结算结果

#### `TaskAssignment`

从“分配记录”升级为“执行片段”。

一条 `TaskAssignment` 表示某位执行人在某一个时间段内实际负责过这道题。这样同一题可以有多次分配、多次接手、多次返修。

新增语义：

- 支持离项转交
- 支持返修重分配
- 支持通过流转链做结算归因

#### `Batch`

继续表示批次主对象，但其状态将承担正式交付与算法验收的阶段表达。

### 新增对象

#### `TaskReview`

表示题目级审核痕迹，统一承载：

- 交付前质检
- 算法抽检命中的题目级判断

建议字段：

- `id`
- `taskItemId`
- `stage`: `qa | algorithm_sampling`
- `decision`: `passed | rejected`
- `reviewerId`
- `notes`
- `createdAt`
- `batchAcceptanceId`: 可空，抽检时关联对应批次验收

#### `BatchDelivery`

表示一次正式批次交付。

建议字段：

- `id`
- `batchId`
- `submittedBy`
- `notes`
- `submittedAt`
- `status`: `submitted | superseded`

说明：

- 一个批次在返修后可以再次交付，因此需要保留多次交付记录。
- 被后续交付覆盖的历史交付可标记为 `superseded`。

#### `BatchAcceptance`

表示算法侧一次正式验收动作。

建议字段：

- `id`
- `deliveryId`
- `reviewedBy`
- `decision`: `accepted | partially_rejected | rejected`
- `sampleSize`
- `notes`
- `reviewedAt`

说明：

- 一次验收对应一次交付。
- 部分驳回时，需要同时落题目级抽检记录。

#### `TaskSettlement`

表示一道题的最终结算裁定结果。

建议字段：

- `id`
- `taskItemId`
- `decisionMode`: `single_owner | split`
- `ownerAssignmentId`: 可空，单归属时使用
- `decidedBy`
- `notes`
- `createdAt`
- `updatedAt`

说明：

- 只在需要做结算归因时创建。
- 一道题只保留一条当前生效的结算裁定。

#### `TaskSettlementShare`

表示拆分归属明细。

建议字段：

- `id`
- `settlementId`
- `assignmentId`
- `percentage`

说明：

- 仅当 `TaskSettlement.decisionMode = split` 时存在。
- 各条 `percentage` 之和必须等于 `100`。

## 状态机设计

### `TaskItem.status`

当前枚举：

- `pending_allocation`
- `pending_pickup`
- `in_progress`
- `submitted`
- `returned`

调整后枚举：

- `pending_allocation`
- `pending_pickup`
- `in_progress`
- `submitted`
- `qa_rejected`
- `qa_passed`
- `delivered`
- `sampling_rejected`
- `sampling_passed`

说明：

- `qa_rejected` 代表题目在交付前被质检打回。
- `qa_passed` 代表题目已通过质检，具备进入交付集合的资格。
- `delivered` 代表题目所在批次已完成一次正式交付。
- `sampling_rejected` 代表该题命中算法抽检且被打回。
- `sampling_passed` 代表该题命中算法抽检且通过。

### `Batch.status`

当前枚举：

- `draft`
- `in_progress`
- `ready_for_delivery`
- `closed`

调整后枚举：

- `draft`
- `in_progress`
- `ready_for_delivery`
- `delivered`
- `partially_rejected`
- `accepted`
- `rejected`
- `closed`

说明：

- `ready_for_delivery` 表示批次达到交付条件但尚未正式发起交付。
- `delivered` 表示已完成一次交付，等待算法验收。
- `partially_rejected` 表示算法抽检后仅部分题被退回整改。
- `accepted` 表示算法正式验收通过。
- `rejected` 表示整批驳回。
- `closed` 保留为业务意义上的最终封账或归档状态。

### `TaskAssignment.status`

当前枚举：

- `assigned`
- `accepted`
- `completed`
- `rejected`

调整后枚举：

- `assigned`
- `accepted`
- `in_progress`
- `completed`
- `rejected`
- `transferred`

说明：

- `transferred` 用于表示该执行片段未由原执行人完成，而是中途转交。

## 代标与流转设计

标注员离项是首版必须覆盖的核心场景。

处理规则如下：

1. 原执行人的 `TaskAssignment` 不标记为 `completed`，而是标记为 `transferred`。
2. 新建一条新的 `TaskAssignment` 给代标人员。
3. 新 assignment 通过 `sourceAssignmentId` 指向原 assignment。
4. 在新旧 assignment 之间记录 `transferReason`。

建议 `transferReason` 枚举：

- `offboarded`
- `leave`
- `capacity_rebalance`
- `rework`
- `manual`

这样系统可以还原：

- 谁最初接单
- 谁中途离项
- 谁接手代标
- 哪次返修后发生了重新分配

## 结算裁定设计

由于代标场景可能引发产量归属争议，系统不应默认把整题自动算给最后完成人。

首版规则：

1. 支持单归属裁定。
2. 支持拆分归属裁定。
3. 结算裁定权归 `项目经理 + 运营`。

裁定模式：

- `single_owner`
- `split`

单归属：

- 通过 `ownerAssignmentId` 指定最终归属给哪一段执行记录。

拆分归属：

- 通过 `TaskSettlementShare` 记录多条 assignment 的比例。

约束：

- 拆分比例总和必须为 `100`
- `ownerAssignmentId` 和 `shares` 不能同时生效

## API 设计

### 执行流 API

#### `POST /tasks/:taskId/assignments`

用途：

- 为题目创建新的执行 assignment

#### `POST /assignments/:assignmentId/transfer`

用途：

- 把一条执行 assignment 转交给新的执行人

请求要点：

- `nextAssigneeId`
- `transferReason`
- `notes`

后端行为：

- 将原 assignment 标记为 `transferred`
- 创建新 assignment
- 更新 `TaskItem.status` 到适合继续流转的阶段

#### `POST /assignments/:assignmentId/accept`

用途：

- 执行人确认接单

#### `POST /assignments/:assignmentId/complete`

用途：

- 执行人提交题目

后端行为：

- 标记 assignment 为 `completed`
- 将 `TaskItem.status` 置为 `submitted`

### 质检 API

#### `POST /tasks/:taskId/reviews`

请求要点：

- `stage = qa`
- `decision = passed | rejected`
- `reviewerId`
- `notes`

后端行为：

- 创建 `TaskReview`
- `passed` 时更新 `TaskItem.status = qa_passed`
- `rejected` 时更新 `TaskItem.status = qa_rejected`

### 批次交付 API

#### `POST /batches/:batchId/deliveries`

请求要点：

- `submittedBy`
- `notes`

后端行为：

- 创建 `BatchDelivery`
- 更新 `Batch.status = delivered`
- 可选地把当前批次内可交付题目标记为 `delivered`

### 算法验收 API

#### `POST /deliveries/:deliveryId/acceptances`

请求要点：

- `reviewedBy`
- `decision = accepted | partially_rejected | rejected`
- `sampleSize`
- `notes`
- `sampledTaskIds`
- `rejectedTaskIds`

后端行为：

1. 创建 `BatchAcceptance`
2. 为抽检命中的题创建 `TaskReview(stage = algorithm_sampling)`
3. 根据决策更新批次状态：
   - `accepted -> Batch.status = accepted`
   - `partially_rejected -> Batch.status = partially_rejected`
   - `rejected -> Batch.status = rejected`
4. 根据抽检结果更新题目状态：
   - 命中且通过 -> `sampling_passed`
   - 命中且打回 -> `sampling_rejected`

### 结算裁定 API

#### `POST /tasks/:taskId/settlement`

请求支持两种形态。

单归属：

- `decisionMode = single_owner`
- `ownerAssignmentId`
- `decidedBy`
- `notes`

拆分归属：

- `decisionMode = split`
- `shares: [{ assignmentId, percentage }]`
- `decidedBy`
- `notes`

后端约束：

- `percentage` 总和必须为 `100`
- assignment 必须都属于当前 task
- `decidedBy` 角色必须是 `项目经理` 或 `运营`

## 页面设计

### 项目页

保持管理视角，继续承载：

- 项目列表
- 项目详情
- 批次列表
- SOP 与验收标准展示

### 批次详情页

在现有基础上扩展右侧动作区：

- 新建任务
- 批量导入 JSON
- 发起交付
- 查看交付历史
- 查看算法验收结果

批次主体区继续展示：

- 题目列表
- 批次状态
- 计划题量与进度

### 任务详情页

在现有基础上新增三个核心区块：

- 执行流转记录
- 质检与抽检记录
- 结算裁定

这样可以同时回答：

- 这道题现在谁在做
- 谁做过
- 谁质检过
- 是否命中抽检
- 最终产量归谁

### 质检交付台

新增面向质检与交付的页面，首版可合并为一个入口。

默认视图：

- 待质检题目
- 已打回题目
- 可交付批次
- 最近交付记录

### 算法验收台

新增面向算法角色的页面。

默认视图：

- 待验收批次
- 抽检样本
- 历史验收结果

## 权限策略

首版不做复杂 RBAC 引擎，但需要在模型与 API 上预留角色语义。

建议角色枚举：

- `project_manager`
- `operations`
- `vendor_manager`
- `annotator`
- `qa_delivery`
- `algorithm_reviewer`

首版裁定权与动作权限：

- 项目经理：可查看全局、发起配置、参与结算裁定
- 运营：可管理 SOP、交付、参与结算裁定
- 运营商：可分发任务，但不参与首版结算裁定
- 标注员：可领取、提交、接收转交
- 质检交付：可创建题目级质检与发起交付
- 算法：可做抽检与批次验收

首版权限控制分两层：

1. 前端控制入口展示
2. 后端控制动作校验

## 数据迁移策略

采用增量 migration。

步骤原则：

1. 优先新增表与新增枚举值。
2. 避免删除现有字段或重命名现有主对象。
3. 通过默认值和兼容逻辑保证旧测试继续可跑。

兼容要求：

- 现有项目、批次、任务、assignment API 继续可用
- 现有页面不需要一次性重做
- 新增页面与卡片按入口逐步挂接

## 智能体赋能点

在本设计完成后，智能体能力可以插入以下位置：

1. SOP 生成与结构化检查
   - 根据项目说明自动生成 SOP 初稿
   - 检查 SOP 是否缺少验收标准、返修规则、角色分工

2. 题目质检辅助
   - 为质检员生成风险提示
   - 对返回题目给出可能问题归因

3. 算法抽检辅助
   - 根据批次特征推荐抽样比例
   - 自动归纳抽检失败模式

4. 交付风险预警
   - 判断批次是否适合发起交付
   - 识别返修率、代标率异常

5. 结算争议辅助
   - 基于 assignment 流转链和操作痕迹生成结算建议草案

## 实施建议

建议按四个开发批次实施：

1. 数据层与后端主 API
   - Prisma schema
   - migration
   - 新增模块与基础 e2e

2. 任务页能力增强
   - 执行流转
   - 质检记录
   - 结算裁定

3. 批次交付与算法验收
   - 批次交付表单
   - 算法验收表单
   - 抽检题关联

4. 角色工作台与智能体辅助入口
   - 质检交付台
   - 算法验收台
   - AI 辅助建议卡片

## 风险与注意事项

1. 题目状态和 assignment 状态都在表达流程，后端必须明确谁是主状态源，避免冲突。
2. 部分驳回后，批次如何再次进入可交付状态需要有明确重算规则。
3. 结算裁定如果允许反复覆盖，必须记录审计痕迹，避免争议。
4. 抽检命中题与未命中题在页面呈现上要有清晰差异，否则算法侧难以理解结果。

## 结论

本设计采用“批次主流程 + 题目抽检子流程 + 执行流转链 + 结算裁定”的标准版方案。

它满足以下核心业务要求：

- 批次级正式交付与算法验收
- 题目级质检与抽检痕迹
- 标注员离项后的代标追踪
- 按题核算下的拆分归属裁定

同时它与当前代码库兼容，适合在现有实现基础上分批落地。
