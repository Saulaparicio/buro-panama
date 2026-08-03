import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Alert01Icon } from 'hugeicons-react';

interface Props {
    children?: ReactNode;
}

interface State {
    hasError: boolean;
    error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-white dark:bg-buro-black text-center">
                    <div className="size-24 bg-red-50 dark:bg-red-900/10 rounded-full flex items-center justify-center mb-8">
                        <Alert01Icon size={48} className="text-red-500" />
                    </div>
                    <h1 className="text-2xl font-black text-buro-black dark:text-white uppercase tracking-widest mb-4">Algo salió mal</h1>
                    <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-8 font-medium">
                        Lo sentimos, ha ocurrido un error inesperado. Nuestro equipo ha sido notificado.
                    </p>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-8 py-3 bg-primary text-white rounded-xl font-black uppercase text-xs tracking-widest hover:brightness-110 transition-all shadow-lg active:scale-95"
                    >
                        Recargar Página
                    </button>
                    {process.env.NODE_ENV === 'development' && (
                        <pre className="mt-12 p-6 bg-gray-50 dark:bg-white/5 rounded-2xl text-left text-xs text-red-400 overflow-auto max-w-full">
                            {this.state.error?.toString()}
                        </pre>
                    )}
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
