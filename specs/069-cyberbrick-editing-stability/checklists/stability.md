# 需求品質 Checklist：CyberBrick 中文與編輯穩定性修復

**Purpose**: 在發布審查前確認四個穩定性修復的需求完整、明確、一致且可驗收
**Created**: 2026-08-19
**Feature**: [spec.md](../spec.md)

**Note**: 本 checklist 檢查「需求寫得是否足以實作與驗收」，不是重複執行產品測試。

## 完整性

- [x] CHK001 工作區監看需求是否同時定義 `present + hash` 與 `absent` 兩種預期狀態？[Spec §FR-001]
- [x] CHK002 是否列出所有必須更新預期主檔狀態的內部寫入、候選提交、復原、刪除與初始化路徑？[Spec §FR-003]
- [x] CHK003 是否明列內建 `field_input`、全部已知自訂文字欄位與函式參數的 IME 覆蓋範圍？[Spec §FR-007、FR-010]
- [x] CHK004 是否同時涵蓋 CyberBrick pyserial、mpremote 與 Arduino Monitor 的 UTF-8 契約？[Spec §FR-011～FR-013]
- [x] CHK005 是否完整定義手動停止、上傳前停止、使用者關閉與裝置斷線四種 Monitor 原因？[Spec §FR-014]
- [x] CHK006 是否明列不可新增的設定、命令、翻譯、workspace schema 與不可回退的主程式保護？[Spec §FR-020]

## 明確性與一致性

- [x] CHK007 「內部重複事件」是否以磁碟實際狀態等於最後內部提交狀態明確判定，而非以事件次數判定？[Spec §FR-001～FR-004]
- [x] CHK008 「最新版本」是否以快速 A／B 提交及 generation 約束具體化，避免畫面、主檔與備份定義不一致？[Spec §FR-005、SC-002]
- [x] CHK009 IME-safe 行為是否與既有 validator、識別字限制、序列化及程式碼產生規則的不變要求一致？[Spec §FR-008～FR-010]
- [x] CHK010 UTF-8 要求是否明確區分 stdout 與 stderr 的獨立解碼狀態及 process 結束 flush？[Spec §邊界情境、FR-012]
- [x] CHK011 預期停止的成功語意是否與真正非預期非成功退出的警告語意互斥且無矛盾？[Spec §FR-015～FR-016]
- [x] CHK012 Monitor service 作為唯一停止訊息來源，是否與既有 WebView `monitorStopped` 格式不變的相容性要求一致？[Spec §FR-017、Plan §4]

## 可驗收性

- [x] CHK013 重複 watcher 事件是否具有至少五次事件、validation 零次及 live-load 零次的量化標準？[Spec §SC-001]
- [x] CHK014 A／B 交錯與外部候選是否都有可觀察的最終磁碟、備份、畫面及 generation 結果？[Spec §SC-002]
- [x] CHK015 中文 IME 是否具有組字、選字、儲存、重載及非預期快捷鍵皆為零的驗收標準？[Spec §SC-003]
- [x] CHK016 UTF-8 是否要求字元內分片後精確等於原字串且不得包含 `�`？[Spec §SC-004]
- [x] CHK017 三種正常 Monitor 停止是否明確要求單一正確原因、成功結束碼與零通知？[Spec §SC-005]
- [x] CHK018 開啟／關閉 Monitor 後立即上傳是否具有至少十輪、零殘留提示及完整上傳資訊的量化標準？[Spec §SC-006]
- [x] CHK019 非預期失敗是否具有保留非成功狀態與斷線警告的回歸標準？[Spec §SC-007]
- [x] CHK020 品質閘門是否列出 compile、lint、完整測試、整合測試、Skill 與 15 語系驗證？[Spec §SC-009]

## 情境與邊界覆蓋

- [x] CHK021 是否涵蓋重複 create／change、重複 delete、真正外部 mismatch 及舊 generation 晚到等邊界？[Spec §邊界情境]
- [x] CHK022 是否保留真正外部候選在拖曳期間延後套用的要求？[Spec §邊界情境、FR-006]
- [x] CHK023 是否涵蓋 composition、`Process`、`keyCode`／`which` 229 的等價輸入狀態？[Spec §邊界情境、FR-008]
- [x] CHK024 是否涵蓋預期停止與 process exit 競態，以及上一輪延遲事件不得污染下一輪生命週期？[Spec §邊界情境]
- [x] CHK025 是否提供 macOS IME、Windows 硬體 Monitor、三平台快速編輯及 Monitor→上傳的人工驗收矩陣？[Spec §SC-003、SC-006、SC-008；Quickstart §手動平台矩陣狀態]

## 假設與範圍

- [x] CHK026 是否明確聲明裝置輸出採 UTF-8，且 Big5／CP950 偵測不在本次範圍？[Spec §假設、§範圍外]
- [x] CHK027 是否明確區分自動契約測試與仍需實際作業系統／硬體完成的人工驗收？[Spec §假設；Quickstart §手動平台矩陣狀態]
- [x] CHK028 是否避免把既有外部候選驗證、備份格式或工作區 schema 的變更納入本 feature？[Spec §假設、§範圍外]

## Notes

- 28/28 項需求品質檢查通過。
- 實作、自動品質閘門與已通過的硬體／跨平台人工矩陣結果見 [quickstart.md](../quickstart.md)。
