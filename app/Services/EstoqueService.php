<?php

namespace App\Services;

use App\Concerns\AuthorizesHouseResource;
use App\Models\House;
use App\Models\ItemCompra;
use App\Models\Produto;
use App\Models\User;
use App\Repositories\ItemCompraRepository;
use App\Repositories\ProdutoRepository;

class EstoqueService
{
    use AuthorizesHouseResource;

    public function __construct(
        private readonly ProdutoRepository $produtoRepo,
        private readonly ItemCompraRepository $compraRepo,
    ) {}

    // ── Dados para as páginas ─────────────────────────────────────────────────

    /**
     * Dados para a visão de Dispensa (estoque).
     */
    public function getDispensaData(House $house): array
    {
        $produtos = $this->produtoRepo->getByHouse($house->id);

        return [
            'produtos' => $produtos->map(fn (Produto $p) => $this->buildProdutoPayload($p)),
            'alertas'  => $this->produtoRepo->countEstoqueBaixo($house->id),
        ];
    }

    /**
     * Dados para a visão de Lista de Compras.
     */
    public function getComprasData(House $house): array
    {
        $itens    = $this->compraRepo->getByHouse($house->id);
        $produtos = $this->produtoRepo->getByHouse($house->id);

        return [
            'itens'    => $itens->map(fn (ItemCompra $i) => $this->buildCompraPayload($i)),
            'produtos' => $produtos->map(fn (Produto $p) => [
                'id'       => $p->id,
                'nome'     => $p->nome,
                'unidade'  => $p->unidade,
                'categoria' => $p->categoria,
                'estoque_atual'  => (float) $p->estoque_atual,
                'estoque_minimo' => (float) $p->estoque_minimo,
            ]),
        ];
    }

    // ── Produtos ──────────────────────────────────────────────────────────────

    public function createProduto(House $house, User $user, array $data): Produto
    {
        return $this->produtoRepo->create($house->id, $user->id, $data);
    }

    public function updateProduto(User $user, Produto $produto, array $data): Produto
    {
        $this->ensureCanEdit($user, $produto);

        return $this->produtoRepo->update($produto, $data);
    }

    public function adjustEstoque(User $user, Produto $produto, float $delta): Produto
    {
        $this->ensureCanEdit($user, $produto);

        return $this->produtoRepo->adjustEstoque($produto, $delta);
    }

    public function deleteProduto(User $user, Produto $produto): void
    {
        $this->ensureCanEdit($user, $produto);
        $this->produtoRepo->delete($produto);
    }

    // ── Lista de Compras ──────────────────────────────────────────────────────

    /**
     * Adiciona um produto à lista de compras.
     * Se o produto já tem uma compra pendente, apenas incrementa a quantidade.
     */
    public function adicionarNaLista(User $user, Produto $produto, array $data): ItemCompra
    {
        // Verifica se já existe compra pendente para este produto
        $existente = ItemCompra::query()
            ->where('produto_id', $produto->id)
            ->where('status', ItemCompra::STATUS_PENDENTE)
            ->first();

        if ($existente) {
            $existente->quantidade_desejada += ($data['quantidade_desejada'] ?? 1);
            $existente->save();

            return $existente;
        }

        return $this->compraRepo->create($user->id, [
            'produto_id'         => $produto->id,
            'quantidade_desejada' => $data['quantidade_desejada'] ?? 1,
            'observacoes'        => $data['observacoes'] ?? null,
        ]);
    }

    /**
     * Cria um produto novo e já adiciona na lista de compras.
     */
    public function criarProdutoEAdicionarNaLista(House $house, User $user, array $data): ItemCompra
    {
        $produto = $this->produtoRepo->create($house->id, $user->id, $data);

        return $this->compraRepo->create($user->id, [
            'produto_id'         => $produto->id,
            'quantidade_desejada' => $data['quantidade_desejada'] ?? 1,
            'observacoes'        => $data['observacoes'] ?? null,
        ]);
    }

    /**
     * Registra compra parcial ou completa.
     * Atualiza o estoque do produto automaticamente.
     */
    public function registrarCompra(User $user, ItemCompra $item, float $quantidade): ItemCompra
    {
        $this->ensureCanEdit($user, $item->produto);

        $item->registrarCompra($quantidade);

        return $item;
    }

    public function updateItemCompra(User $user, ItemCompra $item, array $data): ItemCompra
    {
        $this->ensureCanEdit($user, $item->produto);

        return $this->compraRepo->update($item, $data);
    }

    public function cancelarItemCompra(User $user, ItemCompra $item): ItemCompra
    {
        $this->ensureCanEdit($user, $item->produto);

        $item->status = ItemCompra::STATUS_CANCELADO;
        $item->save();

        return $item;
    }

    public function deleteItemCompra(User $user, ItemCompra $item): void
    {
        $this->ensureCanEdit($user, $item->produto);
        $this->compraRepo->delete($item);
    }

    // -------------------------------------------------------------------------
    // Payloads
    // -------------------------------------------------------------------------

    private function buildProdutoPayload(Produto $p): array
    {
        return [
            'id'              => $p->id,
            'nome'            => $p->nome,
            'unidade'         => $p->unidade,
            'categoria'       => $p->categoria,
            'prioridade'      => $p->prioridade,
            'estoque_atual'   => (float) $p->estoque_atual,
            'estoque_minimo'  => (float) $p->estoque_minimo,
            'estoque_baixo'   => $p->estoqueBaixo(),
            'falta_para_minimo' => $p->faltaParaMinimo(),
            'atualizado_em'   => $p->updated_at?->format('d/m'),
        ];
    }

    private function buildCompraPayload(ItemCompra $i): array
    {
        $produto = $i->produto;

        return [
            'id'                   => $i->id,
            'produto_id'           => $produto->id,
            'nome'                 => $produto->nome,
            'unidade'              => $produto->unidade,
            'categoria'            => $produto->categoria,
            'prioridade'           => $produto->prioridade,
            'quantidade_desejada'  => (float) $i->quantidade_desejada,
            'quantidade_comprada'  => (float) $i->quantidade_comprada,
            'falta'                => $i->falta(),
            'progresso'            => $i->progresso(),
            'status'               => $i->status,
            'observacoes'          => $i->observacoes,
            'estoque_atual'        => (float) $produto->estoque_atual,
            'estoque_minimo'       => (float) $produto->estoque_minimo,
        ];
    }
}
