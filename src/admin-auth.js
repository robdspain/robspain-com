(function () {
  var loginOpened = false;

  function openGoogleLogin() {
    if (!window.netlifyIdentity) return;
    window.netlifyIdentity.open('login');
    loginOpened = true;
  }

  function showAuthWall() {
    if (!document.querySelector('[data-admin-auth-screen]')) {
      document.body.insertAdjacentHTML('beforeend', [
        '<main class="admin-auth-screen" data-admin-auth-screen>',
        '  <section class="admin-auth-card">',
        '    <div class="admin-auth-mark">G</div>',
        '    <h1>Sign in to Family Dashboard</h1>',
        '    <p>Use your Google account to access the Rob Spain family admin tools.</p>',
        '    <button type="button" data-admin-login><span class="admin-auth-google-icon">G</span><span>Continue with Google</span></button>',
        '  </section>',
        '</main>'
      ].join(''));
    }
    var button = document.querySelector('[data-admin-login]');
    if (button) {
      button.addEventListener('click', function () {
        openGoogleLogin();
      });
    }
    setTimeout(function () {
      if (!loginOpened && window.netlifyIdentity && !window.netlifyIdentity.currentUser()) {
        openGoogleLogin();
      }
    }, 250);
  }

  function allowPage() {
    var wall = document.querySelector('[data-admin-auth-screen]');
    if (wall) wall.remove();
    document.documentElement.classList.remove('admin-auth-pending');
  }

  function initIdentityGate() {
    if (!window.netlifyIdentity) {
      showAuthWall();
      return;
    }

    window.netlifyIdentity.on('init', function (user) {
      if (user) allowPage();
      else showAuthWall();
    });

    window.netlifyIdentity.on('login', function () {
      window.netlifyIdentity.close();
      window.location.reload();
    });

    window.netlifyIdentity.on('logout', function () {
      window.location.reload();
    });

    window.netlifyIdentity.init();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initIdentityGate);
  } else {
    initIdentityGate();
  }
})();
