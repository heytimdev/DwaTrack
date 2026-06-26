import { Component } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error("Page error:", error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
        <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center mb-4">
          <AlertTriangle size={26} className="text-red-500" />
        </div>
        <h2 className="text-base font-semibold text-gray-800 m-0 mb-2">Something went wrong</h2>
        <p className="text-sm text-gray-500 m-0 mb-5 max-w-xs">
          This page encountered an error. Your data is safe — try refreshing.
        </p>
        <button
          onClick={() => this.setState({ hasError: false, error: null })}
          className="flex items-center gap-2 bg-teal-500 hover:bg-teal-600 text-white text-sm font-medium px-5 py-2.5 rounded-lg border-none cursor-pointer transition-colors"
        >
          <RefreshCw size={14} /> Try again
        </button>
      </div>
    );
  }
}
