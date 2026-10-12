(() => {
  const dialog = document.querySelector('.internship-lightbox');
  if (!dialog || typeof dialog.showModal !== 'function') return;
  document.querySelectorAll('.internship-photo-open').forEach(button => {
    button.addEventListener('click', () => {
      const source = button.querySelector('img');
      const image = dialog.querySelector('img');
      image.src = source.src;
      image.alt = source.alt;
      dialog.showModal();
    });
  });
  dialog.querySelector('button').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
  });
})();
