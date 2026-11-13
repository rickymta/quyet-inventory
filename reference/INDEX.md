# Bản đồ mã nguồn app gốc (`reference/original/index.html`)

Sinh tự động. Số dòng là số dòng trong `index.html`. Bảng hành động `A` nằm ở dòng 6680–7493 và được chia cho các phân hệ theo nơi dùng.

## Phân hệ

| Phân hệ (thư mục `client/src/modules/<tên>`) | Dải dòng | KB mã (kèm hành động A) |
|---|---|---|
| core | 1400–1775, 2137–2180, 5182–5275, 6649–6679, 7576–7637, 7783–7818, 10958–11021 | 51 (+2) |
| excel | 1776–2136 | 16 (+0) |
| baocao | 2181–2503 | 21 (+2) |
| docs | 2504–2821 | 20 (+1) |
| forms | 2822–3261 | 34 (+3) |
| hsd | 3262–3452, 5081–5107 | 12 (+0) |
| periods | 3453–3631, 4500–4535, 4565–4693, 7918–8123 | 38 (+7) |
| count | 4694–5080, 6456–6648, 7494–7575, 7638–7709, 7819–7917 | 61 (+9) |
| scan | 3632–4499 | 49 (+5) |
| home | 4536–4564, 5163–5181, 5276–5364, 7710–7782, 8124–8253 | 34 (+2) |
| settings | 5108–5162, 5365–5456 | 11 (+4) |
| assets | 5457–6455 | 72 (+0) |
| recon | 8254–9971 | 161 (+0) |
| pay | 9972–10957 | 88 (+0) |
| err | 11022–11272 | 49 (+0) |
| ana | 11274–11896 | 44 (+0) |
| sign | 11897–12123 | 23 (+0) |

## Hành động `A.xxx` (định nghĩa trong khối `var A={...}`, dòng 6680–7493) theo phân hệ sở hữu

`core` đã được port sẵn trong `client/src/core`. Các `Object.assign(A,{...})` nằm ngoài khối này thuộc phân hệ theo dải dòng.

### core
`go`@6681–6689, `navGo`@6690–6693, `navStock`@6694–6698, `drawerToggle`@6699–6702, `drawerClose`@6703–6706, `navGroup`@7017–7020, `sbToggle`@7021–7024, `navFolder`@7025, `navFolderAdd`@7026, `closeSheet`@7343

### baocao
`bcSrcToggle`@6761–6769, `bcSrcLatest`@6770–6777, `bcUseSrc`@6778–6791, `bcFiles`@6792–6808, `bcSet`@7008, `bcBr`@7009–7015

### docs
`sigOpen`@6930–6939, `sigClear`@6940–6944, `sigPanelToggle`@6945–6946

### forms
`hvNew`@6947, `hvOpen`@6948, `hvDelete`@6949, `hvBlank`@6950, `hvField`@6951, `hvPerson`@6952, `hvToggle`@6953, `hvItemAdd`@6954, `hvItem`@6955, `hvItemDel`@6956, `hvSave`@6957–6962, `hvPrint`@6963–6964, `exNew`@6965, `exOpen`@6966, `exDelete`@6967, `exBlank`@6968, `exField`@6969, `exPerson`@6970, `exToggle`@6971, `exItemAdd`@6972, `exItem`@6973, `exItemDel`@6974, `exBPAdd`@6975, `exBP`@6976, `exBPDel`@6977, `exSave`@6978–6983, `exPrint`@6984–6985, `pickOpen`@6986, `pickClose`@6987, `pickPeriod`@6988, `pickToggle`@6989, `pickAdd`@6990–7007

### periods
`onFile`@6707–6722, `upSheet`@6723–6730, `upHr`@6731–6736, `upStart`@6737, `upMap`@6738, `upBranch`@6739, `upUseSrc`@6740–6745, `upSrcClear`@6746, `createPeriod`@6747–6760, `zeroReset`@6879–6886, `navFoldersToggle`@7016, `openFolder`@7027, `trBack`@7058, `trDest`@7059, `trQ`@7060, `trMore`@7061, `trToggle`@7062–7066, `trAll`@7067–7071, `trNone`@7072, `trCreate`@7073–7102, `upBack`@7265–7268, `folderAdd`@7269–7276, `folderRename`@7277–7290, `folderDel`@7291–7296, `folderNewPeriod`@7297, `periodMove`@7298, `periodMoveSave`@7299–7308, `renamePeriod`@7310–7317, `delPeriod`@7318–7322

### count
`periodExplain`@7028–7052, `periodTransfer`@7053–7057, `periodBack`@7260–7264, `openPeriod`@7309, `qInput`@7323, `openStock`@7324, `stQ`@7325, `stBr`@7326, `stMore`@7327, `setFlt`@7328, `setBr`@7329, `more`@7330, `pgGo`@7331, `pgSize`@7332, `pSort`@7333, `exportCur`@7334–7337, `kiemKeEmail`@7338–7341, `openItem`@7342, `seqStart`@7344–7353, `key`@7354–7376, `calc`@7377–7399, `bat`@7400, `noteQuick`@7401–7410, `sheetDirty`@7411, `sheetCancel`@7412, `sheetSkip`@7413–7420, `batAdd`@7421, `batDel`@7422, `photoTake`@7423–7434, `photoClear`@7435, `sheetSave`@7436–7477, `sheetReset`@7478–7492

### scan
`scanOpen`@7103–7109, `scClose`@7110–7121, `scNext`@7122–7127, `scOpenItem`@7128–7132, `scManual`@7133–7137, `scAuto`@7138–7144, `scOcr`@7145–7153, `scOcrUse`@7154–7157, `scOcrPick`@7158–7169, `scQtySave`@7170–7186, `scPickKho`@7187–7191, `scQtyMatch`@7192–7197, `scQtySet`@7198, `scTorch`@7199–7204, `scZoom`@7205–7208, `scPickQ`@7209–7219, `scLink`@7220–7229, `scCopyLink`@7230–7235, `scPhoto`@7236–7259

### settings
`pfSet`@6809–6822, `backupNow`@6823–6843, `bkTap`@6844–6849, `backupSnooze`@6850, `restoreFile`@6851–6878, `syncExport`@6887, `replaceFile`@6888–6913, `badDownload`@6914, `badReset`@6915–6918, `restorePrev`@6919–6929

## Hàm/biến cấp cao nhất theo phân hệ sở hữu

### core
`KK_LIBS`@1424, `KK_LP`@1425, `kkHas`@1426, `kkTry`@1427, `kkLoad`@1439, `kkNeed`@1446, `norm`@1456, `esc`@1457, `ICONS`@1459, `FCC`@1491, `FCP`@1492, `fcG`@1511, `fcIco`@1512, `fcGly`@1516, `navIco`@1518, `fcKey`@1519, `icon`@1524, `qtyCheck`@1529, `parseNum`@1538, `fmt`@1557, `soThanhChu`@1562, `daysTo`@1591, `fmtDate`@1598, `normKey`@1599, `branchCode`@1600, `diffOf`@1609, `needsCount`@1610, `zeroPending`@1611, `BUCKETS`@1613, `QUICK_NOTES`@1621, `quickNoteChipsHtml`@1622, `LS_MAX`@1632, `IDBM`@1633, `store`@1663, `saveT`@1726, `saveSoon`@1727, `audit`@1731, `sanitizeDb`@1739, `validBackup`@1747, `BK_SCHEMA`@1755, `bkSum`@1756, `bkCore`@1763, `bkIntegrity`@1765, `DEFAULT_FOLDERS`@2138, `FD`@2139, `db`@2140, `route`@2141, `P`@2142, `BC`@2143, `BCMETA`@2144, `ST`@2145, `UP`@2146, `SB`@2147, `HV`@2148, `EX`@2149, `PICK`@2150, `qT`@2151, `stqT`@2152, `per`@2154, `hsdEntries`@2155, `toast`@2173, `NAV_FOLDERS_OPEN`@5183, `navCurFolder`@5184, `navCounts`@5189, `navGroups`@5194, `navActive`@5229, `navHtml`@5235, `navApplyOpen`@5249, `userInitials`@5252, `renderUser`@5257, `renderNavOld`@5262, `render`@6649, `APP_VERSION`@7578, `UPD_SHOWN`@7579, `UPD_LAST`@7580, `updFmt`@7581, `showUpdateBanner`@7582, `reloadLatest`@7595, `checkForUpdate`@7607, `HR_SLUG`@7785, `HR_FALL`@7786, `HR_REV`@7787, `hrView`@7789, `hrSafe`@7790, `hashSync`@7791, `hrGo`@7800, `renderNav`@7806

### excel
`FIELDS`@1777, `KW`@1787, `ORDER`@1797, `autoMap`@1799, `detectHeaderRow`@1818, `colName`@1833, `validateItems`@1836, `validateHtml`@1850, `buildItems`@1859, `XLSX_MIME`@1889, `fileNameOf`@1890, `dlAnchor`@1891, `shareOrDownload`@1901, `hsdRowsOf`@1915, `buildBienBan`@1934, `exportExcel`@2113, `exportExcelBasic`@2124

### baocao
`HHTM_CODES`@2182, `readKiemKeXlsx`@2183, `DEFAULT_NGUOI`@2233, `defaultNguoi`@2240, `ensureBCMeta`@2247, `generateBaoCao`@2255, `BCSRC`@2402, `periodCounted`@2403, `bcBranchOfPeriod`@2404, `bcFromPeriod`@2410, `bcSrcCardHtml`@2424, `renderBaoCao`@2445

### docs
`PR_DEF`@2506, `PAPER`@2507, `PR`@2508, `prPage`@2509, `docStyle`@2510, `printTableHtml`@2526, `xlPrint`@2537, `docHeaderHtml`@2545, `docSignHtml`@2553, `docSignHtml4`@2561, `docHeaderHtmlBP`@2580, `docWrap`@2586, `toMhtml`@2592, `exportDocHtml`@2612, `printPreviewHtml`@2623, `SIGP`@2638, `deviceLabel`@2639, `nowLabel`@2645, `SIG_TITLES`@2649, `SIG_KEYS`@2650, `sigStore`@2652, `sigRerender`@2659, `sigPersist`@2662, `sigBoxHtml`@2665, `sigSectionHtml`@2680, `sigPeriodToggle`@2688, `sigPadOpen`@2695, `sigPadClear`@2732, `sigPadClose`@2737, `sigExport`@2741, `RENAME_CB`@2751, `renameModal`@2752, `renameClose`@2766, `renameSave`@2770, `waOk`@2779, `waRand`@2780, `waB64`@2781, `waUn`@2782, `waEnroll`@2783, `waSign`@2789, `sigConfirm`@2793

### forms
`renderPicker`@2823, `chkLine`@2852, `chipGroupUI`@2858, `toggleArr`@2867, `nextSoVanBan`@2868, `profileFillHV`@2878, `profileFillEX`@2884, `dot`@2890, `HV_LOAI`@2893, `HV_LYDO`@2894, `HV_HOSO`@2895, `newHV`@2896, `renderHandoverList`@2906, `generateHandoverDoc`@2925, `renderHandoverEdit`@2978, `EX_LOAI`@3049, `EX_PHATHIEN`@3050, `EX_NGUYENNHAN`@3051, `EX_BANGCHUNG`@3052, `newEX`@3053, `renderExplainList`@3064, `generateExplainDoc`@3083, `renderExplainEdit`@3162

### hsd
`showHsdEmailPicker`@3264, `openMailtoSafe`@3306, `exportHsdAlert`@3324, `renderHsd`@5082

### periods
`QUY_CHE_TEXT`@3456, `XAC_NHAN_HAN_NGAY`@3457, `sigConfirmBlock`@3458, `exportKiemKeEmail`@3471, `periodCardHtml`@3545, `periodCardHtml0`@3548, `guessFolder`@3566, `migrateFolders`@3572, `periodsIn`@3583, `TR`@3585, `trAvail`@3586, `trItems`@3587, `trRow`@3594, `trSelCount`@3603, `renderTrList`@3604, `renderTransfer`@3614, `renderFolder`@4500, `moveModal`@4522, `KIC`@4535, `srcItemsOf`@4567, `upSrcCardHtml`@4579, `renderUploadFromSrc`@4601, `renderUpload`@4624, `LS`@7919, `LS_LBL`@7920, `LSX`@7921, `lsAssetCard`@7981, `renderLists`@7993, `zeroResetHtml`@8031, `lockTagHtml`@8037, `lockBarHtml`@8040, `LKX`@8050, `HM`@8114, `hmKey`@8115, `hmStats`@8116

### count
`SKEY`@4695, `skey`@4696, `skeyWarm`@4697, `baseList`@4701, `filteredList`@4709, `renderPeriod`@4718, `renderChips`@4741, `pgBar`@4764, `pSortList`@4775, `pTableHtml`@4796, `renderList`@4824, `renderStock`@4885, `renderStockRows`@4905, `compressImg`@4942, `keypadHtml`@4959, `bxList`@4969, `bxLeft`@4970, `bxQtyOf`@4971, `bxSeenQty`@4972, `bxTotalQty`@4973, `bxQtyInp`@4974, `bxExpHtml`@4978, `bxRecord`@4984, `bxAutoOut`@5003, `scBoxHtml`@5009, `isTracked`@5022, `bxListHtml`@5023, `renderBoxes`@5039, `renderBatches`@5050, `applyItem`@5064, `eanOk`@6457, `unmList`@6463, `unmOpenCount`@6464, `unmKeyOf`@6465, `unmAdd`@6466, `unmBannerHtml`@6473, `scUnmChip`@6483, `scTrack`@6491, `scUnmNotice`@6503, `scUnmCode`@6516, `asAutoAdd`@6524, `asAddedNotice`@6537, `scChipClick`@6552, `UNM`@6557, `unmOpen`@6558, `unmClose`@6564, `unmCands`@6569, `unmItemBtn`@6570, `unmRender`@6573, `unmFind`@6603, `unmSearch`@6604, `unmQ`@6609, `unmLink`@6614, `unmIgnore`@6629, `unmReopen`@6630, `unmExtra`@6631, `addUnmSheet`@6636, `bxCur`@7495, `bxSaveLabel`@7500, `HS`@7652, `v2Periods`@7654, `v2Cur`@7655, `v2Use`@7661, `v2Scan`@7668, `v2List`@7672, `v2Manual`@7673, `v2ManualQ`@7683, `v2ManualEnter`@7691, `v2Hero`@7696, `v2HeroInfo`@7700, `v2Hub`@7704, `v2PeriodInit`@7819, `invStats`@7825, `v2Ring`@7834, `renderPhotoSec`@7846, `v2Tags`@7851, `v2Keys`@7858, `openSheet`@7859

### scan
`ZX_URLS`@3633, `SC`@3634, `parseGS1`@3635, `scCanon`@3660, `scHasCode`@3666, `SCIDX`@3676, `scIndex`@3677, `scPickItem`@3686, `scMatch`@3694, `scEnsureZx`@3728, `scInitDecoder`@3729, `SCFMT`@3733, `scRoi`@3736, `scDecodeZx`@3743, `scDecode`@3751, `scInApp`@3763, `scLoadImage`@3768, `scPause`@3781, `scResume`@3787, `scMsg`@3788, `scMount`@3789, `v_ready`@3810, `scStart`@3811, `scTick`@3852, `scInfoGs1`@3871, `scShowMatched`@3875, `scShowKho`@3893, `scShowUnmatched`@3902, `scBindCode`@3918, `scOnCode`@3937, `OCR_URL`@3953, `OCR_LANG`@3954, `OCR`@3955, `ocrLoadScript`@3956, `ocrCreate`@3964, `ocrWorker`@3979, `ocrParse`@3993, `ocrPump`@4003, `ocrRun`@4013, `ocrStripLines`@4019, `ocrKeep`@4038, `ocrBands`@4089, `ocrCrop`@4114, `ocrSkew`@4127, `ocrPrep`@4141, `ocrFrame`@4189, `OCR_CONF`@4217, `ocrLooksDate`@4218, `ocrDigits`@4219, `ocrLev`@4220, `ocrRank`@4236, `scCandHtml`@4255, `scOcrNear`@4262, `scHint`@4263, `scGuideCrop`@4266, `scSig`@4273, `scOcrStatus`@4281, `scOcrFail`@4282, `scOcrRetry`@4287, `scJudge`@4293, `scAutoOcr`@4299, `RISK`@4365, `scRisky`@4366, `ocrQtyCands`@4382, `SC_CHIP`@4393, `scBeep`@4394, `scLogRender`@4402, `scCommit`@4409, `scTools`@4426, `scOcrProcess`@4436, `scShowOcr`@4480

### home
`renderHomeOld`@4536, `homeNoticesHtml`@5163, `hubCards`@5276, `mgData`@5287, `renderMgmt`@5306, `renderDcHub`@5325, `renderReportHub`@5333, `prCardHtml`@5352, `fcAgo`@7710, `fcHello`@7711, `fcRatePts`@7716, `fcRate`@7721, `fcDelta`@7734, `fcHdr`@7743, `fcErrCnt`@7749, `fcErrMsg`@7753, `fcMobTask`@7754, `fcPanels`@7756, `renderHome`@7778, `HM_N`@8125, `hmPol`@8126, `hmArc`@8127, `hmSt`@8128, `hmDial`@8129, `hmTrend`@8133, `homeMonthCard`@8161

### settings
`tsLabel`@5110, `mergeDb`@5114, `renderSettings`@5365, `SG_ROLES`@5399, `sgOf`@5407, `sgBranches`@5416, `sgCount`@5424, `sgConfigured`@5425, `SGX`@5426, `sgCardHtml`@5437

### assets
`PH`@5458, `phAdd`@5519, `phDelItem`@5526, `phFill`@5527, `phSharp`@5534, `phSharpen`@5543, `phFrame`@5550, `phBurst`@5558, `phStill`@5569, `phShoot`@5581, `phNote`@5593, `phTemFor`@5598, `PC`@5610, `phCamClose`@5611, `phCamBar`@5618, `phCam`@5624, `phCamTorch`@5659, `phCamZoom`@5660, `phCamReview`@5661, `phCamShoot`@5665, `phCamFile`@5671, `phCamRetake`@5677, `phCamUse`@5678, `phView`@5679, `asPhotoSec`@5687, `asPhotoRefresh`@5697, `asShootRow`@5698, `addPhotoSheet`@5703, `ASQ`@5730, `ASST`@5731, `AP`@5732, `asPer`@5733, `asDiff`@5734, `asDate`@5735, `asIso`@5736, `asLocOf`@5737, `asRid`@5738, `asStats`@5739, `asRooms`@5748, `asTeam`@5753, `asNextStt`@5757, `asParseSheet`@5760, `renderAssets`@5812, `renderAsset`@5848, `asRenderBody`@5875, `asApply`@5924, `asDefaults`@5939, `asModal`@5946, `asModalClose`@5951, `asEdit`@5952, `ASD`@5987, `asShowMatched`@5988, `asShowDup`@6026, `asConfirmNum`@6039, `asShowUnmatched`@6052, `asFileName`@6068, `asRowVals`@6072, `asOrdered`@6084, `AS_HEAD`@6088, `buildAssetXlsx`@6089, `asPrintHtml`@6148, `asCurP`@6162, `asLog`@6163, `asPending`@6169, `asExpBanner`@6174, `asToolsRow`@6180, `asSummary`@6186, `asSumHtml`@6203, `asLogHtml`@6219, `asSheetHead`@6230, `addSummarySheet`@6238, `addLogSheet`@6249, `ASX`@6258

### recon
`RC_SEED`@8255, `RC_LD`@8256, `RC_LX`@8257, `RC_ST`@8258, `RC_TABS`@8259, `RC_KEYS`@8260, `RC_MAPS`@8262, `RC_CF`@8263, `RC_HD`@8265, `RC`@8269, `RC_RES`@8270, `rcSeedCfg`@8272, `rcDb`@8285, `rcK`@8294, `rcNum`@8295, `rcF`@8296, `rcDate`@8297, `rcDStr`@8305, `rcToday`@8306, `rcVid`@8308, `rcTok`@8310, `rcHit`@8311, `rcDm`@8312, `rcCompute`@8316, `rcIn`@8431, `rcCsList`@8432, `rcSum`@8433, `rcNames`@8441, `rcTbl`@8443, `rcSel`@8447, `rcScopeTxt`@8448, `rcScopeTag`@8449, `rcScopePill`@8450, `rcScopeLine`@8451, `rcFilter`@8452, `rcBadge`@8460, `RC_GRP`@8462, `RC_SUBN`@8463, `RC_ONLY`@8464, `rcQ`@8465, `rcSgn`@8466, `rcSgnF`@8467, `rcSvcRows`@8468, `rcDtByPid`@8473, `rcCell`@8478, `rcEmpty`@8479, `rcSvcBlk`@8480, `rcXCell`@8488, `rcFoot`@8492, `rcFootMsg`@8496, `rcCmpBox`@8497, `rcCmpD`@8499, `rcCmpX`@8512, `rcGi`@8535, `rcNav`@8536, `rcSubNav`@8540, `rcQuickBar`@8544, `rcAcc`@8548, `rcMapBuild`@8549, `MP_COLS`@8603, `MP_BANDS`@8604, `mpCell`@8605, `rcMapB`@8612, `rcMapBody`@8613, `rcViewMapX`@8650, `renderRecon`@8659, `KY_BADGE`@8672, `RC_KYL`@8673, `kyKey`@8674, `kyTime`@8675, `rcKyBadge`@8676, `rcKyStat`@8677, `rcKyGet`@8683, `rcKyCard`@8689, `rcKyTable`@8710, `rcViewSum`@8727, `rcSelN`@8759, `rcListRows`@8760, `rcChipsHtml`@8765, `rcListBody`@8768, `rcViewList`@8793, `RC_GO`@8801, `rcViewChk`@8811, `rcViewMap`@8826, `rcViewCfg`@8831, `rcViewMapGen`@8884, `rcViewImp`@8894, `rcHdr`@8910, `rcMk`@8919, `RC_UNDO`@8952, `RC_FLD`@8953, `RC_FLB`@8954, `RC_MODE`@8955, `rcPidN`@8956, `rcDK`@8957, `rcLoose`@8959, `rcShow`@8968, `rcRowDiff`@8970, `rcApply`@8984, `rcSnap`@9040, `rcImpReport`@9055, `rcRunImport`@9089, `rcImpShow`@9098, `rcImpHtml`@9101, `rcImpCard`@9156, `rcRows`@9167, `rcWbOut`@9168, `rcWs`@9169, `RC_FD`@9619, `RC_FX`@9620, `RC_KQ`@9654, `RC_KQX`@9655, `RC_APX_HEAD`@9656, `RC_APX_CLS`@9657, `rcYears`@9658, `rcYrOk`@9659, `rcApxRow`@9661, `rcApxBuild`@9687, `rcApxCard`@9722, `rcViewApx`@9733, `rcMergeRecon`@9767

### pay
`PAY`@9975, `payInM`@9977, `payMLab`@9978, `PAY_CSL0`@9979, `PAY_CFG0`@9980, `payDb`@9981, `payCsCodes`@9992, `payCsName`@9993, `payCsLabel`@9994, `payCsFull`@9995, `payCsFromCt`@9996, `payEcOk`@10001, `payK`@10002, `payN`@10003, `payD`@10004, `payDs`@10005, `payHn`@10006, `payF`@10007, `payPri`@10008, `payCol`@10009, `payColAny`@10010, `payHdr`@10011, `paySheet`@10019, `payParse`@10024, `payHKey`@10073, `payMerge`@10074, `payCompute`@10093, `PAY_LOI`@10139, `PAY_LOI_KW`@10140, `payNKey`@10141, `payNoteFromText`@10142, `payNoteGet`@10143, `payNoteErrs`@10148, `payNoteRow`@10153, `payNoteMut`@10154, `payOkGet`@10162, `PAY_CSN`@10163, `payRowHay`@10164, `payHits`@10168, `payHitHtml`@10176, `payKeep`@10189, `payNoteEdHtml`@10190, `payContent`@10197, `paySoHd`@10201, `payCheck`@10204, `PAY_ST`@10216, `payMonths`@10217, `payScopeLine`@10227, `payTag`@10229, `payAddHtml`@10230, `payHomeHtml`@10242, `payAttn`@10285, `payNccListHtml`@10286, `payListHtml`@10304, `PAY_ZALO_MAX`@10313, `payErrAll`@10314, `payZaloParts`@10343, `payErrCard`@10358, `payErrHtml`@10364, `payCfgHtml`@10387, `payCsCfgHtml`@10392, `payNguoiLap`@10398, `payDetailHtml`@10399, `payStep1Html`@10428, `pxIc`@10437, `payStepsHtml`@10441, `payNextBtn`@10448, `payRepHtml`@10450, `renderPay`@10474, `payFont`@10486, `payToday`@10487, `payPut`@10488, `paySname`@10494, `payAddDn`@10499, `payAddBk`@10541, `payAddDs`@10567, `PAY_ST_LB`@10598, `PAY_ST_FILL`@10599, `payDObj`@10600, `payAddRecon`@10601, `payOut`@10664, `payAscii`@10667, `payNeed`@10668, `PAY_PCSS`@10671, `payPrintDn`@10680, `payPrintBk`@10697, `payPrintOpen`@10708, `payTpl`@10715, `payCL`@10744, `PAY_KCAT`@10745, `payAddErr`@10746

## Các chỗ "vá đè" (monkey patch) — phải gộp vào hành vi cuối cùng của hàm bị vá

| Dòng | Hàm bị gán lại | Phân hệ chịu trách nhiệm gộp |
|---|---|---|
| 7624 | `A.scClose` | scan |
| 7653 | `A.openPeriod` | count |
| 7903 | `A.calc` | count |
| 8102 | `renderAsset` | assets (bản vá ở dải periods) |
| 8110 | `A.go` | periods (8110) / err (11198): tự bọc trong index.js |
| 8111 | `A.openFolder` | periods |
| 8178 | `A.hmSet` | home |
| 8181 | `A.hmGo` | home |
| 8187 | `renderHome` | home |
| 8195 | `LKX.lock` | periods |
| 8196 | `LKX.unlock` | periods |
| 8197 | `A.delPeriod` | periods |
| 8199 | `renderSettings` | settings |
| 11198 | `A.go` | periods (8110) / err (11198): tự bọc trong index.js |
