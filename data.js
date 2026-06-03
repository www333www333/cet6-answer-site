const CET6_SESSIONS = [
  { year: 2025, month: "12", label: "2025年12月", examDate: "2025-12-13" },
  { year: 2025, month: "06", label: "2025年6月", examDate: "2025-06-14" },
  { year: 2024, month: "12", label: "2024年12月", examDate: "2024-12-14" },
  { year: 2024, month: "06", label: "2024年6月", examDate: "2024-06-15" },
  { year: 2023, month: "12", label: "2023年12月", examDate: "2023-12-16" },
  { year: 2023, month: "06", label: "2023年6月", examDate: "2023-06-17" }
];

const SECTION_GUIDES = {
  writing: {
    title: "写作详解",
    points: [
      "录入建议：题目要求、参考范文、结构拆解、核心表达、可替换句式。",
      "评分关注：内容切题、逻辑衔接、语言准确度、词汇丰富度。",
      "可公开发布前，请确认范文来源与真题题干使用权限。"
    ]
  },
  listening: {
    title: "听力详解",
    points: [
      "录入建议：答案、定位句、干扰项、场景词汇、同义替换。",
      "按短篇新闻、长对话、听力篇章分组整理，便于复盘。",
      "音频文件建议只放自有或授权资源，并在页面中标注来源。"
    ]
  },
  reading: {
    title: "阅读详解",
    points: [
      "录入建议：选词填空、长篇匹配、仔细阅读逐题解释。",
      "重点写清定位段、选项排除理由和关键词替换。",
      "不要把未授权文章全文复制进公开网页。"
    ]
  },
  translation: {
    title: "翻译详解",
    points: [
      "录入建议：中文原文、参考译文、难句处理、词组搭配。",
      "可添加多个译法版本，展示高分表达与稳妥表达。",
      "翻译题材料同样需要确认合法使用范围。"
    ]
  }
};

const ANSWER_LAYOUT = [
  ...Array.from({ length: 25 }, (_, index) => ({
    no: String(index + 1),
    section: "听力"
  })),
  ...Array.from({ length: 30 }, (_, index) => ({
    no: String(index + 26),
    section: index < 10 ? "阅读-选词填空" : index < 20 ? "阅读-长篇匹配" : "阅读-仔细阅读"
  })),
  { no: "写作", section: "写作" },
  { no: "翻译", section: "翻译" }
];

function createEmptyAnswers() {
  return ANSWER_LAYOUT.map((item) => ({
    no: item.no,
    section: item.section,
    answer: "",
    explanation: "待录入授权答案与解析"
  }));
}

function createPapers() {
  return CET6_SESSIONS.flatMap((session) =>
    [1, 2, 3].map((setNo) => ({
      id: `${session.year}-${session.month}-set-${setNo}`,
      year: session.year,
      month: session.month,
      label: session.label,
      examDate: session.examDate,
      setNo,
      title: `${session.label}大学英语六级第${setNo}套`,
      status: "待导入",
      source: "本页预置外部资料入口；站内详解请填入自有或授权来源",
      resources: {
        paperUrl: `https://www.wehuster.com/cet6/cet6_${session.year}_${session.month}_${setNo}`,
        answerUrl: `https://www.wehuster.com/cet6/cet6_${session.year}_${session.month}_${setNo}_ans`
      },
      answers: createEmptyAnswers(),
      sections: {
        writing: {
          summary: "待录入写作题目、参考范文和结构解析。",
          notes: SECTION_GUIDES.writing.points
        },
        listening: {
          summary: "待录入听力答案、原文授权片段、定位句和干扰项分析。",
          notes: SECTION_GUIDES.listening.points
        },
        reading: {
          summary: "待录入阅读答案、定位段落、同义替换和排除理由。",
          notes: SECTION_GUIDES.reading.points
        },
        translation: {
          summary: "待录入翻译原文、参考译文、词组搭配和难句解析。",
          notes: SECTION_GUIDES.translation.points
        }
      }
    }))
  );
}

window.CET6_BASE_PAPERS = createPapers();
window.CET6_SECTION_GUIDES = SECTION_GUIDES;
