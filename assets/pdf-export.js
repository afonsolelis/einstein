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
    }
    pdf.save(safeFileName());
  };

  const downloadMaterial = async (element) => {
    const canvas = await capture(element);
    const pdf = new window.jspdf.jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imageHeight = (canvas.height * pageWidth) / canvas.width;
    const image = canvas.toDataURL('image/jpeg', 0.92);
    let remainingHeight = imageHeight;
    let position = 0;

    pdf.addImage(image, 'JPEG', 0, position, pageWidth, imageHeight, undefined, 'FAST');
    remainingHeight -= pageHeight;
    while (remainingHeight > 0) {
      position = remainingHeight - imageHeight;
      pdf.addPage();
      pdf.addImage(image, 'JPEG', 0, position, pageWidth, imageHeight, undefined, 'FAST');
      remainingHeight -= pageHeight;
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
