// Sistema de categorização automática de itens de compras

// Categorias usadas no sistema (para filtros e exibição)
export const CATEGORIAS = [
    "Mercearia",
    "Laticínios",
    "Frios",
    "Carnes",
    "Hortifruti",
    "Padaria",
    "Congelados",
    "Bebidas",
    "Limpeza",
    "Higiene",
    "Pet",
    "Bebê",
    "Sobremesas",
    "Temperos",
    "Enlatados",
    "Outros"
] as const;

// Categorias do catálogo de produtos
export const CATEGORIAS_CATALOGO = [
    "Mercearia",
    "Laticínios",
    "Frios",
    "Carnes",
    "Hortifruti",
    "Padaria",
    "Congelados",
    "Bebidas",
    "Limpeza",
    "Higiene",
    "Pet",
    "Bebê"
] as const;

export type Categoria = typeof CATEGORIAS[number];
export type CategoriaCatalogo = typeof CATEGORIAS_CATALOGO[number];

// Mapeamento de palavras-chave para categorias
const CATEGORIA_KEYWORDS: Record<string, string[]> = {
    "Mercearia": [
        "arroz", "feijão", "açúcar", "sal", "óleo", "azeite", "vinagre",
        "macarrão", "espaguete", "parafuso", "farinha", "fubá", "aveia",
        "café", "achocolatado", "leite condensado", "creme de leite",
        "milho em conserva", "ervilha", "extrato de tomate", "molho de tomate",
        "catchup", "mostarda", "maionese", "sardinha", "atum",
        "biscoito", "bolacha", "gelatina", "granola", "cereal"
    ],
    "Laticínios": [
        "leite", "queijo", "manteiga", "requeijão", "iogurte",
        "ricota", "mussarela", "muçarela", "parmesão", "gorgonzola",
        "cream cheese", "cottage", "nata", "chantilly", "margarina"
    ],
    "Frios": [
        "presunto", "mortadela", "peito de peru", "salame", "apresuntado",
        "blanquet", "copa", "lombo", "calabresa"
    ],
    "Carnes": [
        "carne", "frango", "peixe", "costela", "picanha", "alcatra",
        "filé", "bife", "linguiça", "salsicha", "hambúrguer", "bacon",
        "coxinha da asa", "sobrecoxa", "peito de frango", "tilápia",
        "salmão", "camarão", "carne moída", "acém", "patinho", "contra filé"
    ],
    "Hortifruti": [
        "maçã", "banana", "alface", "tomate", "laranja", "limão", "cebola",
        "alho", "batata", "cenoura", "pepino", "pimentão", "abóbora",
        "berinjela", "beterraba", "brócolis", "couve", "espinafre", "repolho",
        "abobrinha", "morango", "uva", "manga", "melancia", "melão",
        "abacaxi", "mamão", "kiwi", "pera", "ameixa", "goiaba"
    ],
    "Padaria": [
        "pão", "baguete", "croissant", "sonho", "rosquinha", "torrada",
        "bisnaguinha", "pão de forma", "pão francês", "pão de queijo",
        "bolo", "fermento"
    ],
    "Congelados": [
        "pizza congelada", "lasanha congelada", "nuggets", "empanado",
        "batata frita", "legumes congelados", "hambúrguer congelado",
        "sorvete", "açaí", "polpa de fruta"
    ],
    "Bebidas": [
        "água", "refrigerante", "suco", "cerveja", "vinho", "chá",
        "energético", "água de coco", "isotônico", "cachaça",
        "vodka", "whisky", "champagne", "espumante"
    ],
    "Limpeza": [
        "sabão", "detergente", "desinfetante", "amaciante", "água sanitária",
        "esponja", "vassoura", "rodo", "pano", "limpador", "multiuso", "cloro",
        "alvejante", "lustra", "cera", "lustrador", "saco de lixo", "desengordurante",
        "papel alumínio"
    ],
    "Higiene": [
        "shampoo", "condicionador", "sabonete", "creme dental", "pasta de dente",
        "escova de dente", "desodorante", "papel higiênico", "absorvente",
        "cotonete", "algodão", "hidratante", "protetor solar"
    ],
    "Pet": [
        "ração", "petisco", "areia de gato", "areia para gato", "coleira",
        "brinquedo pet", "comedouro", "bebedouro pet", "sachê", "antipulgas"
    ],
    "Bebê": [
        "fralda", "lenço umedecido", "pomada para assadura", "leite em pó infantil",
        "mamadeira", "chupeta", "papinha"
    ],
    "Sobremesas": [
        "doce de leite", "chocolate", "bala", "pudim",
        "brigadeiro", "mousse", "torta", "paçoca", "bombom", "goiabada", "marmelada"
    ],
    "Temperos": [
        "pimenta", "orégano", "manjericão", "alecrim", "tomilho",
        "curry", "açafrão", "cominho", "canela", "cravo", "noz moscada",
        "colorau", "tempero", "sazon", "caldo", "knorr", "maggi"
    ],
    "Enlatados": [
        "palmito", "azeitona", "cogumelo", "tomate pelado"
    ]
};

export function categorizarItem(nomeItem: string): Categoria {
    const nomeLower = nomeItem.toLowerCase().trim();

    for (const [categoria, keywords] of Object.entries(CATEGORIA_KEYWORDS)) {
        for (const keyword of keywords) {
            if (nomeLower.includes(keyword.toLowerCase())) {
                return categoria as Categoria;
            }
        }
    }

    return "Outros";
}

export function getCategoriaColor(categoria: string): string {
    const colors: Record<string, string> = {
        "Mercearia": "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
        "Laticínios": "bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300",
        "Frios": "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300",
        "Carnes": "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
        "Hortifruti": "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
        "Padaria": "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
        "Congelados": "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300",
        "Bebidas": "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300",
        "Limpeza": "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
        "Higiene": "bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300",
        "Pet": "bg-lime-100 text-lime-800 dark:bg-lime-900/30 dark:text-lime-300",
        "Bebê": "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300",
        "Sobremesas": "bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-900/30 dark:text-fuchsia-300",
        "Temperos": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
        "Enlatados": "bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-300",
        "Outros": "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
    };

    return colors[categoria] || colors["Outros"];
}
