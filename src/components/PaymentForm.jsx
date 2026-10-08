import Icon from './Icon.jsx';
import '../styles/components/PaymentForm.css';

const methods = [
  { id: 'UPI', icon: '◈', detail: 'A familiar tap, a simulated success.' },
  { id: 'Credit / Debit Card', icon: '▤', detail: 'Select only — never enter card details.' },
  { id: 'Net Banking', icon: '⌂', detail: 'A safe, frontend-only preview.' },
  { id: 'Wallet', icon: '▣', detail: 'One easy step in this demo.' },
];

export default function PaymentForm({ selectedMethod, onSelect, state, onPay, onFailure, onCancel, onRetry, amount }) {
  const processing = state === 'processing';
  return <>
    <span className="eyebrow">SELECT A METHOD</span>
    <div className="payment-method-list">{methods.map((method) => <button type="button" disabled={processing} className={`payment-method ${selectedMethod === method.id ? 'payment-method--active' : ''}`} key={method.id} onClick={() => onSelect(method.id)}><span className="payment-method__icon">{method.icon}</span><span className="payment-method__copy"><strong>{method.id}</strong><small>{method.detail}</small></span><span className="payment-method__radio" /></button>)}</div>
    {processing ? <div className="payment-state payment-state--processing"><span className="loading-spinner" /><div><strong>Processing Payment...</strong><p>Confirming your {selectedMethod} payment in demo mode.</p></div><button className="text-button text-button--danger" type="button" onClick={onCancel}>Cancel</button></div> : state === 'failed' ? <div className="payment-state payment-state--failed"><span className="payment-state__symbol">!</span><div><strong>Payment failed</strong><p>No money was taken. Try another option or retry.</p></div><button className="button button--outline" type="button" onClick={onRetry}>Try again</button></div> : state === 'cancelled' ? <div className="payment-state payment-state--cancelled"><span className="payment-state__symbol">×</span><div><strong>Payment cancelled</strong><p>Your booking is still in progress. Continue whenever you’re ready.</p></div><button className="button button--outline" type="button" onClick={onRetry}>Continue</button></div> : <div className="payment-actions"><button className="button button--coral button--wide" type="button" onClick={onPay}>Pay {amount} <Icon name="arrow" size={16} /></button><button className="text-button" type="button" onClick={onFailure}>Simulate payment failure</button><button className="text-button" type="button" onClick={onCancel}>Cancel payment</button></div>}
    <p className="payment-disclaimer"><Icon name="spark" size={15} />Your checkout is a demonstration; it never contacts a financial institution or stores card numbers.</p>
  </>;
}
