import { Component } from "react";

// Keeps one broken page from blanking the whole app (and looking like a logout).
export default class ErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { err: null }; }
  static getDerivedStateFromError(err) { return { err }; }
  componentDidCatch(err) { console.error("Page crashed:", err); }
  componentDidUpdate(prev) { if (this.state.err && prev.resetKey !== this.props.resetKey) this.setState({ err: null }); }
  render() {
    if (!this.state.err) return this.props.children;
    return (
      <div style={{ background: "#fdf0ef", border: "1px solid #e3b4b0", borderRadius: 10, padding: 20, color: "#6b1d17", fontSize: 14, lineHeight: 1.6 }}>
        <strong>Something went wrong showing this page.</strong> You are still signed in and nothing was lost. Click another tab to continue, or reload the page. If it keeps happening, tell the MRCT Center team which page you clicked.
        <div style={{ marginTop: 8, fontSize: 12, opacity: 0.8 }}>{String(this.state.err?.message || this.state.err)}</div>
      </div>
    );
  }
}
