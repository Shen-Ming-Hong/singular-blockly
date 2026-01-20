# Blockly API 合約

本文件定義與 Blockly API 整合的介面規範。

---

## Workspace 初始化選項

### maxInstances 配置

```typescript
interface MaxInstancesConfig {
	micropython_main: 1;
	arduino_setup_loop: 1;
}
```

**使用位置**: `media/js/blocklyEdit.js` 的 `Blockly.inject()` 呼叫

---

## Block 方法合約

### setDeletable(boolean)

控制積木是否可被刪除。

```typescript
interface Block {
	setDeletable(deletable: boolean): void;
	isDeletable(): boolean;
}
```

### getBlocksByType(type: string)

取得工作區中所有指定類型的積木。

```typescript
interface Workspace {
	getBlocksByType(type: string, ordered?: boolean): Block[];
}
```

---

## 事件監聽合約

### BLOCK_DELETE 事件

```typescript
interface BlockDeleteEvent {
	type: typeof Blockly.Events.BLOCK_DELETE;
	blockId: string;
	oldJson: object; // 被刪除積木的 JSON 表示
}
```

### BLOCK_CREATE 事件

```typescript
interface BlockCreateEvent {
	type: typeof Blockly.Events.BLOCK_CREATE;
	blockId: string;
	json: object;
}
```

---

## 主程式積木管理函數 (待實作)

```typescript
/**
 * 檢查並更新主程式積木的 deletable 狀態
 * @param workspace Blockly 工作區
 * @param blockType 積木類型 ('micropython_main' | 'arduino_setup_loop')
 */
function updateMainBlockDeletable(workspace: Blockly.Workspace, blockType: string): void;

/**
 * 取得當前模式的主程式積木類型
 * @param board 當前開發板 ID
 * @returns 對應的主程式積木類型
 */
function getMainBlockType(board: string): 'micropython_main' | 'arduino_setup_loop';
```
