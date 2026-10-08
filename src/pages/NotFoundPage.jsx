import { Link } from 'react-router-dom';
import Icon from '../components/Icon.jsx';
import '../styles/pages/NotFoundPage.css';

export default function NotFoundPage() {
  return <main className="page-shell not-found-page"><span className="not-found-mark">404 <i>✦</i></span><span className="eyebrow">WRONG SIDE OF THE MARQUEE</span><h1>This page took<br /><em>the night off.</em></h1><p>The good shows are still on. Let’s find you one.</p><Link to="/events" className="button button--coral">Explore events <Icon name="arrow" size={16} /></Link></main>;
}
