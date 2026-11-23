/**
 * 결맞소 X LUCA 크리스마스 파티 신청서(12.25) — "사진 파일명 변경 필수" 적용
 *
 * 4차 신청서((여자) 결맞소 로테이션 소개팅 4차 참가 신청서 12.19)의 방식을 그대로 가져옵니다.
 *   1) 사진 업로드 문항의 설명(파일명 규칙 안내)을 4차 폼에서 복사
 *   2) 「아래 내용을 모두 확인했어요」 체크박스에 "사진 파일명을 바꿔서제출했어요" 항목 추가
 *   3) 그 체크박스를 필수 + "모든 항목 선택" 검증으로 설정 → 체크 안 하면 제출 불가
 *
 * 사용법 (script.google.com → 새 프로젝트 → 이 코드 붙여넣기)
 *   ① preview() 실행 → 로그에서 두 폼의 현재 상태 확인 (아무것도 바꾸지 않음)
 *   ② apply() 실행 → 크리스마스 폼 수정
 *   ③ 크리스마스 폼 미리보기에서 체크 안 하고 제출 → 막히는지 확인
 */

var SRC_FORM_ID = '13uNBhmyXtppvJieiw_eV-0DCmhBdklZ02nJQYqIZCoI'; // (여자) 4차 신청서 — 참고용, 수정 안 함
var DST_FORM_ID = '1_Qy3J5eh3iJMGX3TGlU4TWZ0Sb46n2T2rKIE5iufse0'; // 크리스마스 파티 신청서 — 수정 대상

var CONFIRM_TITLE_KEYWORD = '아래 내용을 모두 확인';
var RENAME_KEYWORD = '파일명';
var FALLBACK_RENAME_CHOICE = '사진 파일명을 바꿔서제출했어요';
// 4차와 같이 '모든 항목을 체크해야 제출'로 만들지 여부
var REQUIRE_ALL_CHOICES = true;

function preview() {
  [SRC_FORM_ID, DST_FORM_ID].forEach(function (id) {
    var form = FormApp.openById(id);
    Logger.log('==== ' + form.getTitle());
    form.getItems().forEach(function (it, i) {
      var line = i + '. [' + it.getType() + '] ' + it.getTitle();
      if (it.getType() === FormApp.ItemType.CHECKBOX) {
        var cb = it.asCheckboxItem();
        line += '  (필수:' + cb.isRequired() + ')\n     - ' +
          cb.getChoices().map(function (c) { return c.getValue(); }).join('\n     - ');
      }
      if (it.getType() === FormApp.ItemType.FILE_UPLOAD) {
        line += '\n     설명: ' + (it.getHelpText() || '(없음)');
      }
      Logger.log(line);
    });
  });
}

function apply() {
  var src = FormApp.openById(SRC_FORM_ID);
  var dst = FormApp.openById(DST_FORM_ID);

  // 1) 업로드 문항 설명 복사
  var srcUpload = findFirst_(src, FormApp.ItemType.FILE_UPLOAD);
  var dstUpload = findFirst_(dst, FormApp.ItemType.FILE_UPLOAD);
  if (!srcUpload || !dstUpload) throw new Error('파일 업로드 문항을 찾지 못했습니다.');
  dstUpload.setHelpText(srcUpload.getHelpText());
  Logger.log('업로드 문항 설명 복사 완료:\n' + srcUpload.getHelpText());

  // 2) 4차의 '파일명' 확인 문구 가져오기
  var srcConfirm = findConfirm_(src);
  var renameChoice = FALLBACK_RENAME_CHOICE;
  if (srcConfirm) {
    srcConfirm.getChoices().forEach(function (c) {
      if (c.getValue().indexOf(RENAME_KEYWORD) >= 0) renameChoice = c.getValue();
    });
  }

  // 3) 크리스마스 폼 확인 체크박스에 추가
  var dstConfirm = findConfirm_(dst);
  if (!dstConfirm) {
    var item = dst.addCheckboxItem().setTitle('아래 내용을 모두 확인했어요');
    dst.moveItem(item.getIndex(), dstUpload.getIndex() + 1);
    dstConfirm = item;
    Logger.log('확인 체크박스가 없어 업로드 문항 바로 뒤에 새로 만들었습니다.');
  }
  var values = dstConfirm.getChoices().map(function (c) { return c.getValue(); });
  var already = values.some(function (v) { return v.indexOf(RENAME_KEYWORD) >= 0; });
  if (!already) values.push(renameChoice);
  dstConfirm.setChoiceValues(values);
  dstConfirm.setRequired(true);
  if (REQUIRE_ALL_CHOICES) {
    dstConfirm.setValidation(
      FormApp.createCheckboxValidation()
        .setHelpText('모든 항목을 확인하고 체크해 주세요.')
        .requireSelectExactly(values.length)
        .build()
    );
  }
  Logger.log((already ? '이미 있던' : '추가한') + ' 항목: ' + renameChoice);
  Logger.log('확인 체크박스 최종 항목(' + values.length + '개, 전부 필수):\n - ' + values.join('\n - '));
}

function findFirst_(form, type) {
  var items = form.getItems(type);
  return items.length ? items[0] : null;
}

function findConfirm_(form) {
  var items = form.getItems(FormApp.ItemType.CHECKBOX);
  for (var i = 0; i < items.length; i++) {
    if (items[i].getTitle().indexOf(CONFIRM_TITLE_KEYWORD) >= 0) return items[i].asCheckboxItem();
  }
  return null;
}
