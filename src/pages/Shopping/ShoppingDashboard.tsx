import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { Card, Button } from '../../components/ui';
import {
    ArrowLeft,
    TrendingUp,
    ShoppingCart,
    DollarSign,
    Award,
    BarChart2,
    PieChart as PieChartIcon
} from 'lucide-react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell
} from 'recharts';
import { format, subMonths, startOfMonth, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const COLORS = [
    '#2E7D32', '#FF6B35', '#1976D2', '#9C27B0', '#00BCD4',
    '#FFC107', '#E91E63', '#795548', '#607D8B', '#4CAF50',
    '#FF5722', '#3F51B5', '#009688', '#CDDC39', '#FF9800', '#8BC34A'
];

type TipoGrafico = 'pizza' | 'barras';

export default function ShoppingDashboard() {
    const navigate = useNavigate();
    const { shoppingLists } = useApp();

    const [periodo, setPeriodo] = useState('3');
    const [listaSelecionada, setListaSelecionada] = useState('todas');
    const [tipoGrafico, setTipoGrafico] = useState<TipoGrafico>('pizza');
    const [limiteCategorias, setLimiteCategorias] = useState(10);

    // Filter finalized lists by period
    const listasFinalizadas = useMemo(() => {
        const dataInicio = startOfMonth(subMonths(new Date(), parseInt(periodo)));
        return shoppingLists.filter(l => {
            if (l.status !== 'finalizada' || !l.data_compra) return false;
            return new Date(l.data_compra) >= dataInicio;
        });
    }, [shoppingLists, periodo]);

    // Reset list selection on period change
    const handlePeriodoChange = (value: string) => {
        setPeriodo(value);
        setListaSelecionada('todas');
    };

    const dadosProcessados = useMemo(() => {
        if (listasFinalizadas.length === 0) return null;

        const listasFiltradas = listaSelecionada === 'todas'
            ? listasFinalizadas
            : listasFinalizadas.filter(l => l.id === listaSelecionada);

        if (listasFiltradas.length === 0) return null;

        const totalGasto = listasFiltradas.reduce((acc, l) => acc + (l.valor_total_lista || 0), 0);

        // Spending by category
        const gastosPorCategoria: Record<string, number> = {};
        listasFiltradas.forEach(lista => {
            lista.items.forEach(item => {
                const cat = item.categoria || 'Outros';
                gastosPorCategoria[cat] = (gastosPorCategoria[cat] || 0) + (item.valor_total_item || 0);
            });
        });

        const dadosCategorias = Object.entries(gastosPorCategoria)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);

        const categoriaMaisGasta = dadosCategorias[0]?.name || 'N/A';

        // Monthly spending (only in "todas" mode)
        const gastosPorMes: Record<string, number> = {};
        if (listaSelecionada === 'todas') {
            listasFiltradas.forEach(lista => {
                if (lista.data_compra) {
                    const mes = format(parseISO(lista.data_compra), 'MMM/yy', { locale: ptBR });
                    gastosPorMes[mes] = (gastosPorMes[mes] || 0) + (lista.valor_total_lista || 0);
                }
            });
        }

        const dadosMensais = Object.entries(gastosPorMes).map(([name, value]) => ({
            name, valor: value
        }));

        const mediaPorCompra = listasFinalizadas.length > 0
            ? listasFinalizadas.reduce((acc, l) => acc + (l.valor_total_lista || 0), 0) / listasFinalizadas.length
            : 0;

        const listaAtual = listaSelecionada !== 'todas' ? listasFiltradas[0] : null;

        return {
            totalGasto,
            totalListas: listasFiltradas.length,
            categoriaMaisGasta,
            mediaPorCompra,
            dadosCategorias,
            dadosMensais,
            listaAtual,
            isCompraUnica: listaSelecionada !== 'todas'
        };
    }, [listasFinalizadas, listaSelecionada]);

    // Limit categories displayed
    const categoriasExibidas = useMemo(() => {
        if (!dadosProcessados?.dadosCategorias) return [];
        const todas = dadosProcessados.dadosCategorias;
        if (limiteCategorias === 0) return todas;
        if (todas.length <= limiteCategorias) return todas;

        const topCategorias = todas.slice(0, limiteCategorias);
        const outrasValor = todas.slice(limiteCategorias).reduce((acc, cat) => acc + cat.value, 0);
        if (outrasValor > 0) return [...topCategorias, { name: 'Outras', value: outrasValor }];
        return topCategorias;
    }, [dadosProcessados?.dadosCategorias, limiteCategorias]);

    const formatCurrency = (value: number) => `R$ ${value.toFixed(2).replace('.', ',')}`;

    return (
        <div className="flex flex-col min-h-screen bg-background">
            {/* Header */}
            <header className="sticky top-0 z-40 bg-card/90 backdrop-blur-md border-b border-border">
                <div className="px-4 md:px-6 lg:px-8 py-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <button
                                className="p-2 rounded-lg hover:bg-muted transition-colors"
                                onClick={() => navigate('/shopping')}
                            >
                                <ArrowLeft className="w-5 h-5 text-text-primary" />
                            </button>
                            <div>
                                <h1 className="text-lg font-bold text-text-primary">Dashboard</h1>
                                <p className="text-xs text-text-secondary">Análise de gastos</p>
                            </div>
                        </div>

                        {/* Filters */}
                        <div className="flex items-center gap-2">
                            <select
                                value={periodo}
                                onChange={(e) => handlePeriodoChange(e.target.value)}
                                className="h-8 text-xs rounded-lg border border-border bg-card text-text-primary px-2"
                            >
                                <option value="1">Último mês</option>
                                <option value="3">Últimos 3 meses</option>
                                <option value="6">Últimos 6 meses</option>
                                <option value="12">Último ano</option>
                            </select>

                            <select
                                value={listaSelecionada}
                                onChange={(e) => setListaSelecionada(e.target.value)}
                                className="h-8 text-xs rounded-lg border border-border bg-card text-text-primary px-2 max-w-[150px]"
                            >
                                <option value="todas">Todas as compras</option>
                                {listasFinalizadas.map(lista => (
                                    <option key={lista.id} value={lista.id}>
                                        {lista.nome_lista} - {lista.data_compra ? format(parseISO(lista.data_compra), 'dd/MM') : ''}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
            </header>

            <main className="flex-1 px-4 md:px-6 lg:px-8 py-6 space-y-6">
                {!dadosProcessados || dadosProcessados.totalListas === 0 ? (
                    <Card className="p-8 text-center border-dashed">
                        <BarChart2 className="w-12 h-12 text-text-secondary/50 mx-auto mb-4" />
                        <p className="text-text-secondary">Nenhuma compra finalizada no período</p>
                        <p className="text-xs text-text-secondary/70 mt-1">
                            Finalize suas listas de compras para ver as estatísticas
                        </p>
                    </Card>
                ) : (
                    <>
                        {/* Selected list info */}
                        {dadosProcessados.isCompraUnica && dadosProcessados.listaAtual && (
                            <Card className="p-4 bg-primary/5 border-primary/20">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-semibold text-text-primary">{dadosProcessados.listaAtual.nome_lista}</p>
                                        <p className="text-sm text-text-secondary">
                                            {dadosProcessados.listaAtual.data_compra
                                                ? format(parseISO(dadosProcessados.listaAtual.data_compra), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
                                                : ''}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm text-text-secondary">Itens</p>
                                        <p className="font-semibold text-text-primary">{dadosProcessados.listaAtual.items.length}</p>
                                    </div>
                                </div>
                            </Card>
                        )}

                        {/* Summary cards */}
                        <div className="grid grid-cols-2 gap-3 md:gap-4">
                            <Card className="p-4 bg-primary/5 border-primary/20">
                                <div className="flex items-center gap-3">
                                    <DollarSign className="w-8 h-8 text-primary flex-shrink-0" />
                                    <div className="min-w-0">
                                        <p className="text-xs text-text-secondary">
                                            {dadosProcessados.isCompraUnica ? 'Valor da compra' : 'Total gasto'}
                                        </p>
                                        <p className="text-xl font-bold text-text-primary truncate">
                                            {formatCurrency(dadosProcessados.totalGasto)}
                                        </p>
                                    </div>
                                </div>
                            </Card>

                            {dadosProcessados.isCompraUnica ? (
                                <Card className="p-4">
                                    <div className="flex items-center gap-3">
                                        <TrendingUp className="w-8 h-8 text-text-secondary flex-shrink-0" />
                                        <div className="min-w-0">
                                            <p className="text-xs text-text-secondary">vs. Média</p>
                                            <p className={`text-xl font-bold truncate ${dadosProcessados.totalGasto > dadosProcessados.mediaPorCompra ? 'text-red-500' : 'text-green-500'}`}>
                                                {dadosProcessados.totalGasto > dadosProcessados.mediaPorCompra ? '+' : '-'}
                                                {formatCurrency(Math.abs(dadosProcessados.totalGasto - dadosProcessados.mediaPorCompra))}
                                            </p>
                                        </div>
                                    </div>
                                </Card>
                            ) : (
                                <Card className="p-4">
                                    <div className="flex items-center gap-3">
                                        <ShoppingCart className="w-8 h-8 text-text-secondary flex-shrink-0" />
                                        <div className="min-w-0">
                                            <p className="text-xs text-text-secondary">Compras</p>
                                            <p className="text-xl font-bold text-text-primary">{dadosProcessados.totalListas}</p>
                                        </div>
                                    </div>
                                </Card>
                            )}

                            <Card className="p-4 bg-green-50/50 dark:bg-green-900/10 border-green-200/50 dark:border-green-800/30">
                                <div className="flex items-center gap-3">
                                    <TrendingUp className="w-8 h-8 text-green-500 flex-shrink-0" />
                                    <div className="min-w-0">
                                        <p className="text-xs text-text-secondary">Média/compra</p>
                                        <p className="text-xl font-bold text-text-primary truncate">
                                            {formatCurrency(dadosProcessados.mediaPorCompra)}
                                        </p>
                                    </div>
                                </div>
                            </Card>

                            <Card className="p-4 bg-amber-50/50 dark:bg-amber-900/10 border-amber-200/50 dark:border-amber-800/30">
                                <div className="flex items-center gap-3">
                                    <Award className="w-8 h-8 text-amber-500 flex-shrink-0" />
                                    <div className="min-w-0">
                                        <p className="text-xs text-text-secondary">
                                            {dadosProcessados.isCompraUnica ? 'Maior categoria' : 'Mais gasta'}
                                        </p>
                                        <p className="text-lg font-bold text-text-primary truncate">
                                            {dadosProcessados.categoriaMaisGasta}
                                        </p>
                                    </div>
                                </div>
                            </Card>
                        </div>

                        {/* Category chart */}
                        <Card className="p-4">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="font-semibold text-text-primary">Gastos por categoria</h2>
                                <div className="flex items-center gap-2">
                                    <select
                                        value={limiteCategorias.toString()}
                                        onChange={(e) => setLimiteCategorias(Number(e.target.value))}
                                        className="h-7 text-xs rounded-lg border border-border bg-card text-text-primary px-1.5"
                                    >
                                        <option value="5">Top 5</option>
                                        <option value="10">Top 10</option>
                                        <option value="0">Todas</option>
                                    </select>
                                    <div className="flex gap-0.5 bg-muted rounded-lg p-0.5">
                                        <button
                                            className={`p-1.5 rounded-md transition-colors ${tipoGrafico === 'pizza' ? 'bg-card shadow-sm text-text-primary' : 'text-text-secondary'}`}
                                            onClick={() => setTipoGrafico('pizza')}
                                        >
                                            <PieChartIcon className="w-4 h-4" />
                                        </button>
                                        <button
                                            className={`p-1.5 rounded-md transition-colors ${tipoGrafico === 'barras' ? 'bg-card shadow-sm text-text-primary' : 'text-text-secondary'}`}
                                            onClick={() => setTipoGrafico('barras')}
                                        >
                                            <BarChart2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {tipoGrafico === 'pizza' ? (
                                <>
                                    <div className="h-64">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={categoriasExibidas}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={50}
                                                    outerRadius={80}
                                                    paddingAngle={2}
                                                    dataKey="value"
                                                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                                                    labelLine={false}
                                                >
                                                    {categoriasExibidas.map((_, index) => (
                                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                    ))}
                                                </Pie>
                                                <Tooltip formatter={(value: number) => [formatCurrency(value), 'Valor']} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>

                                    {/* Legend list */}
                                    <div className="mt-4 space-y-2">
                                        {categoriasExibidas.map((cat, index) => (
                                            <div key={cat.name} className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <div
                                                        className="w-3 h-3 rounded-full flex-shrink-0"
                                                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                                                    />
                                                    <span className="text-sm text-text-secondary">{cat.name}</span>
                                                </div>
                                                <span className="text-sm font-medium text-text-primary">{formatCurrency(cat.value)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            ) : (
                                <div style={{ height: Math.max(250, categoriasExibidas.length * 40) }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart
                                            data={categoriasExibidas}
                                            layout="vertical"
                                            margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
                                        >
                                            <CartesianGrid strokeDasharray="3 3" horizontal vertical={false} />
                                            <XAxis
                                                type="number"
                                                tick={{ fontSize: 11 }}
                                                tickFormatter={(value) => `R$${value}`}
                                            />
                                            <YAxis
                                                type="category"
                                                dataKey="name"
                                                tick={{ fontSize: 12 }}
                                                width={75}
                                            />
                                            <Tooltip formatter={(value: number) => [formatCurrency(value), 'Valor']} />
                                            <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                                                {categoriasExibidas.map((_, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            )}
                        </Card>

                        {/* Monthly evolution chart */}
                        {!dadosProcessados.isCompraUnica && dadosProcessados.dadosMensais.length > 1 && (
                            <Card className="p-4">
                                <h2 className="font-semibold text-text-primary mb-4">Evolução mensal</h2>
                                <div className="h-64">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={dadosProcessados.dadosMensais}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                                            <YAxis tick={{ fontSize: 12 }} tickFormatter={(value) => `R$${value}`} />
                                            <Tooltip formatter={(value: number) => [formatCurrency(value), 'Gasto']} />
                                            <Bar dataKey="valor" fill="var(--color-primary, #6366f1)" radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </Card>
                        )}
                    </>
                )}
            </main>
        </div>
    );
}
