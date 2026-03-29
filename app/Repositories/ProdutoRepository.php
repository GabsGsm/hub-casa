<?php

namespace App\Repositories;

use App\Models\Produto;
use Illuminate\Support\Collection;

class ProdutoRepository
{
    public function getByHouse(int $casaId): Collection
    {
        return Produto::query()
            ->where('casa_id', $casaId)
            ->orderBy('nome')
            ->get();
    }

    /**
     * Retorna produtos com estoque abaixo do mínimo.
     */
    public function getEstoqueBaixo(int $casaId): Collection
    {
        return Produto::query()
            ->where('casa_id', $casaId)
            ->where('estoque_minimo', '>', 0)
            ->whereColumn('estoque_atual', '<=', 'estoque_minimo')
            ->orderBy('nome')
            ->get();
    }

    public function countEstoqueBaixo(int $casaId): int
    {
        return Produto::query()
            ->where('casa_id', $casaId)
            ->where('estoque_minimo', '>', 0)
            ->whereColumn('estoque_atual', '<=', 'estoque_minimo')
            ->count();
    }

    public function create(int $casaId, int $userId, array $data): Produto
    {
        return Produto::create([
            'casa_id'        => $casaId,
            'criado_por'     => $userId,
            'nome'           => $data['nome'],
            'unidade'        => $data['unidade'] ?? 'un',
            'categoria'      => $data['categoria'] ?? null,
            'prioridade'     => $data['prioridade'] ?? 'normal',
            'estoque_atual'  => $data['estoque_atual'] ?? 0,
            'estoque_minimo' => $data['estoque_minimo'] ?? 0,
        ]);
    }

    public function update(Produto $produto, array $data): Produto
    {
        $allowed = [
            'nome', 'unidade', 'categoria', 'prioridade',
            'estoque_atual', 'estoque_minimo',
        ];

        $produto->fill(array_intersect_key($data, array_flip($allowed)));
        $produto->save();

        return $produto;
    }

    public function adjustEstoque(Produto $produto, float $delta): Produto
    {
        $produto->estoque_atual = max(0, (float) $produto->estoque_atual + $delta);
        $produto->save();

        return $produto;
    }

    public function delete(Produto $produto): void
    {
        $produto->delete();
    }
}
