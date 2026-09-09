(() => {
  const componentUrl = document.currentScript?.src || '';
  const icon = '<svg class="pdf-export-icon" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M6 2h8l4 4v16H6V2Zm7 1.5V7h3.5L13 3.5ZM8 11h8v1.5H8V11Zm0 3h8v1.5H8V14Zm0 3h5v1.5H8V17Z"/></svg>';

  const addStylesheet = () => {
    if (!componentUrl || document.querySelector('link[data-pdf-export-style]')) return;
    const stylesheet = document.createElement('link');
    stylesheet.rel = 'stylesheet';
    stylesheet.href = new URL('pdf-export.css', componentUrl).href;
    stylesheet.dataset.pdfExportStyle = '';
    document.head.appendChild(stylesheet);
  };

  const loadScript = (path) => new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${path}"]`)) return resolve();
    const script = document.createElement('script');
    script.src = path;
    script.onload = resolve;
    script.onerror = () => reject(new Error(`Não foi possível carregar ${path}`));
    document.head.appendChild(script);
  });

  const loadPdfTools = async () => {
    if (!window.html2canvas) await loadScript(new URL('vendor/pdf/html2canvas.min.js', componentUrl).href);
    if (!window.jspdf) await loadScript(new URL('vendor/pdf/jspdf.umd.min.js', componentUrl).href);
  };

  const safeFileName = () => (document.title || 'material')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '')
    .toLowerCase() + '.pdf';

  const capture = (element) => window.html2canvas(element, {
    backgroundColor: '#ffffff',
    scale: 1.25,
    useCORS: true,
    logging: false,
    windowWidth: element.scrollWidth,
    windowHeight: element.scrollHeight,
    ignoreElements: (node) => node.id === 'pdf-export-button' || node.matches?.('.floating-nav, .actions')
  });

  const addSlideTextLayer = (pdf, slide, canvas) => {
    const text = slide.innerText.replace(/\n{3,}/g, '\n\n').trim();
    if (!text) return;
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(16);
    pdf.text(text, 50, 50, {
      maxWidth: canvas.width - 100,
      lineHeightFactor: 1.35,
      renderingMode: 'invisible'
    });
  };

  const downloadSlides = async (slides) => {
    let pdf;
    for (let index = 0; index < slides.length; index += 1) {
      const canvas = await capture(slides[index]);
      if (!pdf) {
        pdf = new window.jspdf.jsPDF({
          orientation: 'landscape',
          unit: 'px',
          format: [canvas.width, canvas.height],
          compress: true
        });
      } else {
        pdf.addPage([canvas.width, canvas.height], 'landscape');
      }
      pdf.addImage(canvas.toDataURL('image/jpeg', 0.92), 'JPEG', 0, 0, canvas.width, canvas.height, undefined, 'FAST');
      addSlideTextLayer(pdf, slides[index], canvas);
    }
    pdf.save(safeFileName());
  };

  const materialBreakPoints = (element, scale) => {
    const root = element.getBoundingClientRect();
    const selectors = 'h1, h2, h3, h4, p, li, pre, table, figure, blockquote, .code-block, .alert-box, .figura';
    const points = [...element.querySelectorAll(selectors)]
      .map((node) => (node.getBoundingClientRect().top - root.top) * scale)
      .filter((point) => point > 0)
      .map((point) => Math.round(point));
    return [...new Set([0, ...points])].sort((first, second) => first - second);
  };

  const canvasSlice = (canvas, start, end) => {
    const slice = document.createElement('canvas');
    slice.width = canvas.width;
    slice.height = end - start;
    slice.getContext('2d').drawImage(canvas, 0, start, canvas.width, end - start, 0, 0, canvas.width, end - start);
    return slice;
  };

  const materialTextBlocks = (element, scale) => {
    const root = element.getBoundingClientRect();
    return [...element.querySelectorAll('h1, h2, h3, h4, p, li, pre, th, td, .code-block')]
      .filter((node) => !node.closest('.actions') && !node.closest('pre')?.matches('pre'))
      .map((node) => {
        const rect = node.getBoundingClientRect();
        return {
          text: node.innerText.replace(/\s+/g, ' ').trim(),
          left: (rect.left - root.left) * scale,
          top: (rect.top - root.top) * scale,
          width: rect.width * scale
        };
      })
      .filter((block) => block.text && block.width > 0);
  };

  const addMaterialTextLayer = (pdf, blocks, start, end, canvas, margin, printableWidth) => {
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    blocks
      .filter((block) => block.top >= start && block.top < end)
      .forEach((block) => {
        const x = margin + ((block.left / canvas.width) * printableWidth);
        const y = margin + (((block.top - start) / canvas.width) * printableWidth) + 3;
        const width = Math.max(10, (block.width / canvas.width) * printableWidth);
        pdf.text(block.text, x, y, {
          maxWidth: width,
          lineHeightFactor: 1.25,
          renderingMode: 'invisible'
        });
      });
  };

  const downloadMaterial = async (element) => {
    const canvas = await capture(element);
    const pdf = new window.jspdf.jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 10;
    const printableWidth = pageWidth - (margin * 2);
    const printableHeight = pageHeight - (margin * 2);
    const maximumSliceHeight = Math.floor((printableHeight * canvas.width) / printableWidth);
    const scale = canvas.width / element.scrollWidth;
    const breakPoints = materialBreakPoints(element, scale);
    const textBlocks = materialTextBlocks(element, scale);
    let start = 0;
    let page = 0;

    while (start < canvas.height) {
      const limit = Math.min(canvas.height, start + maximumSliceHeight);
      const minimumPreferredBreak = start + (maximumSliceHeight * 0.45);
      // Reserva espaço para o próximo bloco. Isso impede que uma lista,
      // parágrafo ou caixa de código comece no rodapé e seja recortada.
      const safeLimit = limit - Math.ceil(192 * scale);
      const candidates = breakPoints.filter((point) => point > minimumPreferredBreak && point <= safeLimit);
      const end = candidates.length ? candidates[candidates.length - 1] : limit;
      const slice = canvasSlice(canvas, start, end);
      const sliceHeight = (slice.height * printableWidth) / slice.width;

      if (page > 0) pdf.addPage();
      pdf.addImage(slice.toDataURL('image/jpeg', 0.92), 'JPEG', margin, margin, printableWidth, sliceHeight, undefined, 'FAST');
      addMaterialTextLayer(pdf, textBlocks, start, end, canvas, margin, printableWidth);
      start = end;
      page += 1;
    }
    pdf.save(safeFileName());
  };

  const setBusy = (busy) => {
    document.querySelectorAll('.pdf-download-action').forEach((button) => {
      button.disabled = busy;
      button.setAttribute('aria-busy', String(busy));
      const label = button.querySelector('.pdf-export-label');
      if (label) label.textContent = busy ? 'Gerando PDF…' : 'Baixar PDF';
    });
  };

  const createPdf = async () => {
    const isSlides = document.body.classList.contains('pdf-export-slides');
    setBusy(true);
    document.body.classList.add('pdf-export-capturing');
    try {
      await document.fonts?.ready;
      await loadPdfTools();
      if (isSlides) await downloadSlides([...document.querySelectorAll('.slide')]);
      else await downloadMaterial(document.querySelector('.container, main') || document.body);
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      window.alert('Não foi possível gerar o PDF nesta página. Tente novamente em alguns instantes.');
    } finally {
      document.body.classList.remove('pdf-export-capturing');
      setBusy(false);
    }
  };

  const setButtonContent = (button, primary) => {
    button.classList.add('pdf-download-action');
    button.type = 'button';
    button.onclick = createPdf;
    button.setAttribute('aria-label', 'Baixar esta página em PDF');
    button.title = 'Baixar esta página em PDF';
    button.innerHTML = primary
      ? `${icon}<span class="pdf-export-label">Baixar PDF</span>`
      : `${icon}<span>Baixar PDF</span>`;
  };

  const setup = () => {
    addStylesheet();
    if (document.getElementById('slider')) document.body.classList.add('pdf-export-slides');

    const legacyButtons = [...document.querySelectorAll('button[onclick*="window.print"]')];
    let button = document.querySelector('.floating-nav .nav-print, .floating-nav [onclick*="window.print"]');
    if (!button) {
      button = document.createElement('button');
      document.body.appendChild(button);
    }
    // A barra de navegação usa transform e criaria um novo contexto para
    // position: fixed; por isso o botão precisa ser irmão dela no body.
    document.body.appendChild(button);
    button.id = 'pdf-export-button';
    setButtonContent(button, true);
    legacyButtons.filter((legacyButton) => legacyButton !== button).forEach((legacyButton) => setButtonContent(legacyButton, false));
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', setup);
  else setup();
})();
