<?php

namespace App\Repositories;

use App\Models\ItemCompra;
use Illuminate\Support\Collection;

class ItemCompraRepository
{
    /**
     * Retorna itens da lista de compras com dados do produto.
     */
    public function getByHouse(int $casaId): Collection
    {
        return ItemCompra::query()
            ->whereHas('produto', fn ($q) => $q->where('casa_id', $casaId))
            ->with('produto:id,nome,unidade,categoria,prioridade,estoque_atual,estoque_minimo')
            ->orderByRaw("CASE WHEN status = 'pendente' THEN 0 WHEN status = 'cancelado' THEN 1 ELSE 2 END")
            ->orderBy('created_at')
            ->get();
    }

    public function create(int $userId, array $data): ItemCompra
    {
        return ItemCompra::create([
            'produto_id'         => $data['produto_id'],
            'criado_por'         => $userId,
            'quantidade_desejada' => $data['quantidade_desejada'] ?? 1,
            'quantidade_comprada' => 0,
            'status'             => ItemCompra::STATUS_PENDENTE,
            'observacoes'        => $data['observacoes'] ?? null,
        ]);
    }

    public function update(ItemCompra $item, array $data): ItemCompra
    {
        $allowed = ['quantidade_desejada', 'status', 'observacoes'];

        $item->fill(array_intersect_key($data, array_flip($allowed)));
        $item->save();

        return $item;
    }

    public function delete(ItemCompra $item): void
    {
        $item->delete();
    }
}
