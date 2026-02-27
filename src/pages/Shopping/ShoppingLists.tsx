import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { Header, Card, Input, Button, Modal } from '../../components/ui';
import {
    Plus,
    ShoppingCart,
    CheckCircle2,
    MoreVertical,
    Copy,
    Pencil,
    Trash2,
    RotateCcw,
    ListChecks,
    Clock,
    BarChart3
} from 'lucide-react';

export default function ShoppingLists() {
    const navigate = useNavigate();
    const {
        shoppingLists,
        addShoppingList,
        deleteShoppingList,
        duplicateShoppingList,
        renameShoppingList,
        reopenShoppingList
    } = useApp();

    const [showNewDialog, setShowNewDialog] = useState(false);
    const [newListName, setNewListName] = useState('');
    const [showRenameDialog, setShowRenameDialog] = useState(false);
    const [renameId, setRenameId] = useState('');
    const [renameName, setRenameName] = useState('');
    const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

    const listasAbertas = shoppingLists.filter(l => l.status === 'aberta');
    const listasFinalizadas = shoppingLists.filter(l => l.status === 'finalizada');

    const handleCreateList = () => {
        if (!newListName.trim()) return;
        const newList = addShoppingList(newListName.trim());
        setNewListName('');
        setShowNewDialog(false);
        navigate(`/shopping/${newList.id}`);
    };

    const handleRename = () => {
        if (!renameName.trim() || !renameId) return;
        renameShoppingList(renameId, renameName.trim());
        setShowRenameDialog(false);
        setRenameId('');
        setRenameName('');
    };

    const handleDelete = (id: string) => {
        deleteShoppingList(id);
        setShowDeleteConfirm(null);
    };

    const openRename = (id: string, currentName: string) => {
        setRenameId(id);
        setRenameName(currentName);
        setShowRenameDialog(true);
        setDropdownOpen(null);
    };

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });
    };

    return (
        <div className="p-4 md:p-6 lg:p-8 space-y-6">
            <Header
                title="Supermercado"
                subtitle="Gerencie suas listas"
                action={
                    <button
                        className="p-2 rounded-lg hover:bg-muted transition-colors"
                        onClick={() => navigate('/shopping/dashboard')}
                        title="Dashboard de compras"
                    >
                        <BarChart3 className="w-5 h-5 text-text-secondary" />
                    </button>
                }
            />

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3">
                <Card className="p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <ListChecks className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-text-primary">{listasAbertas.length}</p>
                        <p className="text-xs text-text-secondary">Em aberto</p>
                    </div>
                </Card>
                <Card className="p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-text-primary">{listasFinalizadas.length}</p>
                        <p className="text-xs text-text-secondary">Finalizadas</p>
                    </div>
                </Card>
            </div>

            {/* Active Lists */}
            <div>
                <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wide mb-3">Listas Ativas</h2>
                {listasAbertas.length === 0 ? (
                    <Card className="p-8 text-center border-dashed">
                        <ShoppingCart className="w-12 h-12 text-text-secondary/50 mx-auto mb-3" />
                        <p className="text-text-secondary">Nenhuma lista ativa</p>
                        <p className="text-xs text-text-secondary/70 mt-1">Crie uma nova lista para começar</p>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {listasAbertas.map(list => {
                            const itemCount = list.items.length;
                            const checkedCount = list.items.filter(i => i.marcado_como_pegado).length;
                            const progress = itemCount > 0 ? (checkedCount / itemCount) * 100 : 0;

                            return (
                                <Card
                                    key={list.id}
                                    className="p-4 cursor-pointer hover:shadow-md transition-all relative group"
                                    onClick={() => navigate(`/shopping/${list.id}`)}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-semibold text-text-primary truncate">{list.nome_lista}</h3>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-xs text-text-secondary">{itemCount} itens</span>
                                                <span className="text-xs text-text-secondary">•</span>
                                                <span className="text-xs text-text-secondary">
                                                    {formatDate(list.data_criacao)}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="relative">
                                            <button
                                                className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setDropdownOpen(dropdownOpen === list.id ? null : list.id);
                                                }}
                                            >
                                                <MoreVertical className="w-4 h-4 text-text-secondary" />
                                            </button>
                                            {dropdownOpen === list.id && (
                                                <div
                                                    className="absolute right-0 top-8 w-44 bg-card border border-border rounded-lg shadow-lg py-1 z-50"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <button
                                                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-primary hover:bg-muted transition-colors"
                                                        onClick={() => openRename(list.id, list.nome_lista)}
                                                    >
                                                        <Pencil className="w-4 h-4" /> Renomear
                                                    </button>
                                                    <button
                                                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-primary hover:bg-muted transition-colors"
                                                        onClick={() => { duplicateShoppingList(list.id); setDropdownOpen(null); }}
                                                    >
                                                        <Copy className="w-4 h-4" /> Duplicar
                                                    </button>
                                                    <button
                                                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                                        onClick={() => { setShowDeleteConfirm(list.id); setDropdownOpen(null); }}
                                                    >
                                                        <Trash2 className="w-4 h-4" /> Excluir
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Progress bar */}
                                    {itemCount > 0 && (
                                        <div className="mt-3">
                                            <div className="flex justify-between text-xs text-text-secondary mb-1">
                                                <span>{checkedCount}/{itemCount} pegos</span>
                                                <span>{Math.round(progress)}%</span>
                                            </div>
                                            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-primary transition-all duration-300 rounded-full"
                                                    style={{ width: `${progress}%` }}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {/* Total */}
                                    {list.valor_total_lista > 0 && (
                                        <p className="text-sm font-semibold text-primary mt-2">
                                            R$ {list.valor_total_lista.toFixed(2).replace('.', ',')}
                                        </p>
                                    )}
                                </Card>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Finalized Lists */}
            {listasFinalizadas.length > 0 && (
                <div>
                    <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wide mb-3">Finalizadas</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {listasFinalizadas.map(list => (
                            <Card
                                key={list.id}
                                className="p-4 opacity-70 hover:opacity-100 cursor-pointer hover:shadow-md transition-all relative group"
                                onClick={() => navigate(`/shopping/${list.id}`)}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-semibold text-text-primary truncate">{list.nome_lista}</h3>
                                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 font-medium">
                                                Finalizada
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 mt-1">
                                            <Clock className="w-3 h-3 text-text-secondary" />
                                            <span className="text-xs text-text-secondary">
                                                {formatDate(list.data_compra)}
                                            </span>
                                            <span className="text-xs text-text-secondary">•</span>
                                            <span className="text-xs text-text-secondary">{list.items.length} itens</span>
                                        </div>
                                    </div>
                                    <div className="relative">
                                        <button
                                            className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setDropdownOpen(dropdownOpen === list.id ? null : list.id);
                                            }}
                                        >
                                            <MoreVertical className="w-4 h-4 text-text-secondary" />
                                        </button>
                                        {dropdownOpen === list.id && (
                                            <div
                                                className="absolute right-0 top-8 w-44 bg-card border border-border rounded-lg shadow-lg py-1 z-50"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <button
                                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-primary hover:bg-muted transition-colors"
                                                    onClick={() => { reopenShoppingList(list.id); setDropdownOpen(null); }}
                                                >
                                                    <RotateCcw className="w-4 h-4" /> Reabrir
                                                </button>
                                                <button
                                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-primary hover:bg-muted transition-colors"
                                                    onClick={() => { duplicateShoppingList(list.id); setDropdownOpen(null); }}
                                                >
                                                    <Copy className="w-4 h-4" /> Duplicar
                                                </button>
                                                <button
                                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                                    onClick={() => { setShowDeleteConfirm(list.id); setDropdownOpen(null); }}
                                                >
                                                    <Trash2 className="w-4 h-4" /> Excluir
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <p className="text-sm font-semibold text-primary mt-2">
                                    R$ {list.valor_total_lista.toFixed(2).replace('.', ',')}
                                </p>
                            </Card>
                        ))}
                    </div>
                </div>
            )}

            {/* FAB */}
            <button
                className="fixed bottom-24 right-6 lg:bottom-8 w-14 h-14 rounded-full bg-primary text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center justify-center z-40"
                onClick={() => setShowNewDialog(true)}
            >
                <Plus className="w-6 h-6" />
            </button>

            {/* New List Dialog */}
            <Modal isOpen={showNewDialog} onClose={() => { setShowNewDialog(false); setNewListName(''); }} title="Nova Lista">
                <div className="space-y-4">
                    <Input
                        placeholder="Nome da lista (ex: Compras da semana)"
                        value={newListName}
                        onChange={(e) => setNewListName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleCreateList()}
                        autoFocus
                    />
                    <div className="flex gap-2 justify-end">
                        <Button variant="ghost" onClick={() => { setShowNewDialog(false); setNewListName(''); }}>
                            Cancelar
                        </Button>
                        <Button onClick={handleCreateList} disabled={!newListName.trim()}>
                            Criar lista
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Rename Dialog */}
            <Modal isOpen={showRenameDialog} onClose={() => setShowRenameDialog(false)} title="Renomear Lista">
                <div className="space-y-4">
                    <Input
                        placeholder="Novo nome"
                        value={renameName}
                        onChange={(e) => setRenameName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleRename()}
                        autoFocus
                    />
                    <div className="flex gap-2 justify-end">
                        <Button variant="ghost" onClick={() => setShowRenameDialog(false)}>
                            Cancelar
                        </Button>
                        <Button onClick={handleRename} disabled={!renameName.trim()}>
                            Salvar
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Delete Confirmation */}
            <Modal isOpen={!!showDeleteConfirm} onClose={() => setShowDeleteConfirm(null)} title="Excluir Lista">
                <div className="space-y-4">
                    <p className="text-text-secondary">Tem certeza que deseja excluir esta lista? Esta ação não pode ser desfeita.</p>
                    <div className="flex gap-2 justify-end">
                        <Button variant="ghost" onClick={() => setShowDeleteConfirm(null)}>
                            Cancelar
                        </Button>
                        <Button
                            className="bg-red-600 hover:bg-red-700 text-white"
                            onClick={() => showDeleteConfirm && handleDelete(showDeleteConfirm)}
                        >
                            Excluir
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
