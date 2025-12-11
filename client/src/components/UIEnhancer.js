import 'bootstrap/dist/css/bootstrap.min.css';
import { useEffect } from 'react';

const UIEnhancer = () => {
  useEffect(() => {
    // Lazy loading for images
    const images = document.querySelectorAll('img[loading="lazy"]');
    images.forEach(img => img.loading = 'lazy');

    // Hover effects for buttons/links
    const interactables = document.querySelectorAll('.btn, a, li');
    interactables.forEach(el => {
      el.addEventListener('mouseenter', (e) => e.target.style.transform = 'scale(1.05)');
      el.addEventListener('mouseleave', (e) => e.target.style.transform = 'scale(1)');
    });

    // Simplified nav (add to your header)
    const navHTML = `
      <nav class="navbar navbar-expand-lg navbar-dark bg-dark">
        <ul class="navbar-nav">
          <li class="nav-item"><a class="nav-link" href="#home">Home</a></li>
          <li class="nav-item"><a class="nav-link" href="#scenes">Scenes</a></li>
          <li class="nav-item"><a class="nav-link" href="#memory">Memory</a></li>
          <li class="nav-item"><a class="nav-link" href="#feedback">Feedback</a></li>
        </ul>
      </nav>
    `;
    document.body.insertAdjacentHTML('afterbegin', navHTML);

    // Feedback form
    const feedbackHTML = `
      <div class="container mt-5">
        <form id="feedbackForm">
          <div class="mb-3">
            <label for="feedback" class="form-label">Your Feedback</label>
            <input type="text" class="form-control" id="feedback" aria-describedby="feedbackHelp">
            <div id="feedbackHelp" class="form-text">Help us make Milla better.</div>
          </div>
          <button type="submit" class="btn btn-primary">Submit</button>
        </form>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', feedbackHTML);

    // Accessibility (ARIA labels)
    const elements = document.querySelectorAll('[role], [aria-label]');
    elements.forEach(el => {
      if (!el.hasAttribute('aria-label')) el.setAttribute('aria-label', el.textContent.trim() || 'Interactive element');
    });
  }, []);

  return null;
};

export default UIEnhancer;
