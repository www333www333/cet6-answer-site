const STORAGE_KEY = "cet6-answer-site-data-v1";

const state = {
  papers: loadPapers(),
  query: "",
  year: "全部",
  month: "全部",
  status: "全部",
  selectedId: null,
  editing: false,
  draftAnswers: null
};

const els = {
  search: document.querySelector("#searchInput"),
  yearFilters: document.querySelector("#yearFilters"),
  monthFilters: document.querySelector("#monthFilters"),
  statusFilters: document.querySelector("#statusFilters"),
  paperList: document.querySelector("#paperList"),
  resultCount: document.querySelector("#resultCount"),
  paperCount: document.querySelector("#paperCount"),
  completedCount: document.querySelector("#completedCount"),
  detailPanel: document.querySelector("#detailPanel"),
  template: document.querySelector("#detailTemplate"),
  printButton: document.querySelector("#printButton"),
  exportButton: document.querySelector("#exportButton"),
  importInput: document.querySelector("#importInput")
};

function loadPapers() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(window.CET6_BASE_PAPERS);
    const saved = JSON.parse(raw);
    return mergePapers(structuredClone(window.CET6_BASE_PAPERS), saved);
  } catch (error) {
    console.warn("资料读取失败，已使用基础数据。", error);
    return structuredClone(window.CET6_BASE_PAPERS);
  }
}

function mergePapers(basePapers, updates) {
  const updateMap = new Map((updates || []).map((paper) => [paper.id, paper]));
  return basePapers.map((basePaper) => {
    const update = updateMap.get(basePaper.id);
    return update ? deepMerge(basePaper, update) : basePaper;
  });
}

function deepMerge(target, source) {
  if (!source || typeof source !== "object") return target;
  const result = Array.isArray(target) ? [...target] : { ...target };
  Object.entries(source).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      result[key] = value;
      return;
    }
    if (value && typeof value === "object") {
      result[key] = deepMerge(result[key] || {}, value);
      return;
    }
    if (value !== "" && value !== null && value !== undefined) {
      result[key] = value;
    }
  });
  return result;
}

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.papers));
}

function unique(values) {
  return [...new Set(values)];
}

function setupFilters() {
  renderSegments(els.yearFilters, ["全部", ...unique(state.papers.map((paper) => paper.year))], "year");
  renderSegments(els.monthFilters, ["全部", "06", "12"], "month", (value) => (value === "06" ? "6月" : value === "12" ? "12月" : value));
  renderSegments(els.statusFilters, ["全部", "待导入", "已录入"], "status");
}

function renderSegments(container, values, key, labeler = (value) => value) {
  container.innerHTML = "";
  values.forEach((value) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `segment-button ${state[key] === value ? "active" : ""}`;
    button.textContent = labeler(value);
    button.addEventListener("click", () => {
      state[key] = value;
      setupFilters();
      render();
    });
    container.appendChild(button);
  });
}

function getFilteredPapers() {
  const query = state.query.trim().toLowerCase();
  return state.papers.filter((paper) => {
    const haystack = [
      paper.title,
      paper.label,
      paper.status,
      paper.year,
      paper.month,
      paper.setNo,
      paper.source,
      "写作 听力 阅读 翻译 答案 解析"
    ]
      .join(" ")
      .toLowerCase();

    return (
      (!query || haystack.includes(query)) &&
      (state.year === "全部" || paper.year === Number(state.year)) &&
      (state.month === "全部" || paper.month === state.month) &&
      (state.status === "全部" || paper.status === state.status)
    );
  });
}

function render() {
  const papers = getFilteredPapers();
  els.paperCount.textContent = state.papers.length;
  els.completedCount.textContent = state.papers.filter((paper) => paper.status === "已录入").length;
  els.resultCount.textContent = `${papers.length} 项`;
  renderPaperList(papers);

  if (!state.selectedId || !papers.some((paper) => paper.id === state.selectedId)) {
    state.selectedId = papers[0]?.id || null;
  }

  if (state.selectedId) {
    renderDetail(getPaper(state.selectedId));
  } else {
    els.detailPanel.innerHTML = `<div class="empty-state"><h3>没有匹配结果</h3><p>换一个关键词或筛选条件试试。</p></div>`;
  }
}

function renderPaperList(papers) {
  els.paperList.innerHTML = "";
  papers.forEach((paper) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `paper-card ${paper.id === state.selectedId ? "active" : ""}`;
    button.innerHTML = `
      <h4>${paper.title}</h4>
      <div class="paper-meta">
        <span>${paper.examDate}</span>
        <span>第${paper.setNo}套</span>
        <span>${paper.status}</span>
      </div>
    `;
    button.addEventListener("click", () => {
      state.selectedId = paper.id;
      state.editing = false;
      state.draftAnswers = null;
      render();
    });
    els.paperList.appendChild(button);
  });
}

function getPaper(id) {
  return state.papers.find((paper) => paper.id === id);
}

function renderDetail(paper) {
  const fragment = els.template.content.cloneNode(true);
  const panel = document.createElement("div");
  panel.appendChild(fragment);

  panel.querySelector(".detail-date").textContent = `${paper.examDate} · ${paper.label}`;
  panel.querySelector(".detail-title").textContent = paper.title;
  panel.querySelector(".detail-subtitle").textContent = `来源：${paper.source}。下方可打开外部真题/答案页面，站内答案表可继续手动录入。`;
  panel.querySelector(".status-badge").textContent = paper.status;
  panel.querySelector(".paper-url").href = paper.resources.paperUrl;
  panel.querySelector(".answer-url").href = paper.resources.answerUrl;

  renderAnswers(panel, paper);
  renderSection(panel, paper, "writing");
  renderSection(panel, paper, "listening");
  renderSection(panel, paper, "reading");
  renderSection(panel, paper, "translation");
  setupTabs(panel);
  setupDetailActions(panel, paper);

  els.detailPanel.innerHTML = "";
  els.detailPanel.appendChild(panel);
}

function renderAnswers(panel, paper) {
  const rows = panel.querySelector(".answerRows");
  const answers = state.editing && state.draftAnswers ? state.draftAnswers : paper.answers;
  rows.innerHTML = "";
  answers.forEach((item, index) => {
    const row = document.createElement("tr");
    if (state.editing) {
      row.innerHTML = `
        <td><strong>${item.no}</strong><br><small>${item.section}</small></td>
        <td><input data-answer-index="${index}" data-answer-field="answer" value="${escapeAttr(item.answer)}" placeholder="答案" /></td>
        <td><textarea data-answer-index="${index}" data-answer-field="explanation" placeholder="解析摘要">${escapeHtml(item.explanation)}</textarea></td>
      `;
    } else {
      row.innerHTML = `
        <td><strong>${item.no}</strong><br><small>${item.section}</small></td>
        <td>${item.answer ? escapeHtml(item.answer) : "<span class='muted'>待录入</span>"}</td>
        <td>${escapeHtml(item.explanation || "待录入授权答案与解析")}</td>
      `;
    }
    rows.appendChild(row);
  });

  if (state.editing) {
    rows.querySelectorAll("input, textarea").forEach((field) => {
      field.addEventListener("input", (event) => {
        const index = Number(event.target.dataset.answerIndex);
        const key = event.target.dataset.answerField;
        state.draftAnswers[index][key] = event.target.value;
      });
    });
  }
}

function renderSection(panel, paper, key) {
  const view = panel.querySelector(`[data-view="${key}"]`);
  const guide = window.CET6_SECTION_GUIDES[key];
  const section = paper.sections[key];
  view.innerHTML = `
    <div class="section-card">
      <h4>${guide.title}</h4>
      <p>${escapeHtml(section.summary)}</p>
      <ul>${section.notes.map((note) => `<li>${escapeHtml(note)}</li>`).join("")}</ul>
    </div>
  `;
}

function setupTabs(panel) {
  const buttons = panel.querySelectorAll(".tab-button");
  const views = panel.querySelectorAll(".tab-view");
  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      buttons.forEach((item) => item.classList.remove("active"));
      views.forEach((item) => item.classList.remove("active"));
      button.classList.add("active");
      panel.querySelector(`[data-view="${button.dataset.tab}"]`).classList.add("active");
    });
  });
}

function setupDetailActions(panel, paper) {
  const editButton = panel.querySelector('[data-action="edit"]');
  const saveButton = panel.querySelector('[data-action="save"]');
  const cancelButton = panel.querySelector('[data-action="cancel"]');
  const sampleButton = panel.querySelector('[data-action="load-sample"]');
  const applyJsonButton = panel.querySelector('[data-action="apply-json"]');
  const textarea = panel.querySelector("#singleImport");

  editButton.hidden = state.editing;
  saveButton.hidden = !state.editing;
  cancelButton.hidden = !state.editing;

  editButton.addEventListener("click", () => {
    state.editing = true;
    state.draftAnswers = structuredClone(paper.answers);
    renderDetail(paper);
  });

  saveButton.addEventListener("click", () => {
    paper.answers = structuredClone(state.draftAnswers);
    paper.status = hasMeaningfulContent(paper) ? "已录入" : "待导入";
    state.editing = false;
    state.draftAnswers = null;
    persist();
    setupFilters();
    render();
  });

  cancelButton.addEventListener("click", () => {
    state.editing = false;
    state.draftAnswers = null;
    renderDetail(paper);
  });

  sampleButton.addEventListener("click", () => {
    textarea.value = JSON.stringify(createImportTemplate(paper), null, 2);
  });

  applyJsonButton.addEventListener("click", () => {
    try {
      const update = JSON.parse(textarea.value);
      applyPaperUpdate(paper.id, update);
      alert("已应用到当前套卷。");
      render();
    } catch (error) {
      alert(`JSON 格式有误：${error.message}`);
    }
  });
}

function createImportTemplate(paper) {
  return {
    id: paper.id,
    status: "已录入",
    source: "资料来源或授权说明",
    answers: [
      { no: "1", section: "听力", answer: "A", explanation: "填写定位句、同义替换和排除理由。" },
      { no: "写作", section: "写作", answer: "范文标题或得分点", explanation: "填写结构分析、亮点表达和常见失分点。" }
    ],
    sections: {
      writing: { summary: "填写写作详解正文。", notes: ["结构拆解", "核心表达", "升级句式"] },
      listening: { summary: "填写听力详解正文。", notes: ["定位句", "干扰项", "场景词"] },
      reading: { summary: "填写阅读详解正文。", notes: ["定位段", "同义替换", "排除理由"] },
      translation: { summary: "填写翻译详解正文。", notes: ["参考译文", "难句处理", "词组搭配"] }
    }
  };
}

function applyPaperUpdate(id, update) {
  const index = state.papers.findIndex((paper) => paper.id === id);
  if (index === -1) return;
  const current = state.papers[index];
  const normalized = { ...update, id };
  if (Array.isArray(update.answers)) {
    normalized.answers = mergeAnswers(current.answers, update.answers);
  }
  state.papers[index] = deepMerge(current, normalized);
  state.papers[index].status = hasMeaningfulContent(state.papers[index]) ? "已录入" : state.papers[index].status;
  persist();
}

function mergeAnswers(currentAnswers, incomingAnswers) {
  const incomingMap = new Map(incomingAnswers.map((item) => [String(item.no), item]));
  return currentAnswers.map((item) => {
    const update = incomingMap.get(String(item.no));
    return update ? { ...item, ...update } : item;
  });
}

function hasMeaningfulContent(paper) {
  return paper.answers.some((item) => item.answer.trim() || item.explanation !== "待录入授权答案与解析");
}

function exportData() {
  const blob = new Blob([JSON.stringify(state.papers, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "cet6-answer-site-data.json";
  link.click();
  URL.revokeObjectURL(url);
}

function importData(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const imported = JSON.parse(reader.result);
      state.papers = mergePapers(structuredClone(window.CET6_BASE_PAPERS), imported);
      persist();
      setupFilters();
      render();
      alert("导入完成。");
    } catch (error) {
      alert(`导入失败：${error.message}`);
    }
  };
  reader.readAsText(file, "utf-8");
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttr(value) {
  return escapeHtml(value).replaceAll("\n", " ");
}

els.search.addEventListener("input", (event) => {
  state.query = event.target.value;
  render();
});

els.printButton.addEventListener("click", () => window.print());
els.exportButton.addEventListener("click", exportData);
els.importInput.addEventListener("change", (event) => {
  const [file] = event.target.files;
  if (file) importData(file);
  event.target.value = "";
});

setupFilters();
render();
