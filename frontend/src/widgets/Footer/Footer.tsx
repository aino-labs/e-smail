import Death13 from "@react/stands";
import "./Footer.scss";

const VERSION = `v${__APP_VERSION__}`;

// TODO: rewrite to react?

class Footer extends Death13.Component {
  render() {
    return (
      <footer className="app-footer">
        <span className="app-footer__version" title={`e-smail ${VERSION}`}>
          {VERSION}
        </span>
      </footer>
    );
  }
}

export default Footer;
