(() => {
  const printPage = () => {
    const button = document.getElementById('pdf-export-button');
    if (button) button.setAttribute('aria-busy', 'true');
    window.print();
  };

  const resetButton = () => {
    const button = document.getElementById('pdf-export-button');
    if (button) button.removeAttribute('aria-busy');
  };

  const addStylesheet = () => {
    const source = document.currentScript;
    if (!source || document.querySelector('link[data-pdf-export-style]')) return;
    const stylesheet = document.createElement('link');
    stylesheet.rel = 'stylesheet';
    stylesheet.href = new URL('pdf-export.css', source.src).href;
    stylesheet.dataset.pdfExportStyle = '';
    document.head.appendChild(stylesheet);
  };

  const setup = () => {
    addStylesheet();
    if (document.getElementById('slider')) {
      document.body.classList.add('pdf-export-slides');
      const slidePrintPage = document.createElement('style');
      slidePrintPage.dataset.pdfExportSlidePage = '';
      slidePrintPage.textContent = '@media print { @page { size: landscape; margin: 0; } }';
      document.head.appendChild(slidePrintPage);
    }

    let button = document.querySelector('.floating-nav .nav-print, .floating-nav [onclick*="window.print"]');
    if (!button) {
      button = document.createElement('button');
      button.type = 'button';
      document.body.appendChild(button);
    }

    button.id = 'pdf-export-button';
    button.type = 'button';
    button.classList.add('pdf-export-button');
    button.setAttribute('aria-label', 'Exportar esta página como PDF');
    button.title = 'Exportar esta página como PDF';
    button.innerHTML = '<svg class="pdf-export-icon" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M6 2h8l4 4v16H6V2Zm7 1.5V7h3.5L13 3.5ZM8 11h8v1.5H8V11Zm0 3h8v1.5H8V14Zm0 3h5v1.5H8V17Z"/></svg><span class="pdf-export-label">Exportar PDF</span>';
    button.onclick = printPage;
    window.addEventListener('afterprint', resetButton);
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', setup);
  else setup();
})();
