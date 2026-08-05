import "./Footer.scss";

const VERSION = `v${__APP_VERSION__}`;

export default function Footer() {
  return (
    <footer className="app-footer">
      <span className="app-footer__version" title={`e-smail ${VERSION}`}>
        {VERSION}
      </span>
    </footer>
  );
}
