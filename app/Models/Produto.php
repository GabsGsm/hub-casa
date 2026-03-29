<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Produto extends Model
{
    use HasFactory;

    protected $table = 'produtos';

    protected $fillable = [
        'casa_id',
        'criado_por',
        'nome',
        'unidade',
        'categoria',
        'prioridade',
        'estoque_atual',
        'estoque_minimo',
    ];

    protected $casts = [
        'estoque_atual'  => 'decimal:2',
        'estoque_minimo' => 'decimal:2',
    ];

    // -------------------------------------------------------------------------
    // Relacionamentos
    // -------------------------------------------------------------------------

    public function casa(): BelongsTo
    {
        return $this->belongsTo(House::class, 'casa_id');
    }

    public function criador(): BelongsTo
    {
        return $this->belongsTo(User::class, 'criado_por');
    }

    public function itensCompra(): HasMany
    {
        return $this->hasMany(ItemCompra::class, 'produto_id');
    }

    /**
     * Item ativo na lista de compras (pendente).
     */
    public function compraAtiva(): HasOne
    {
        return $this->hasOne(ItemCompra::class, 'produto_id')
            ->where('status', 'pendente')
            ->latestOfMany();
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    public function estoqueBaixo(): bool
    {
        return $this->estoque_atual <= $this->estoque_minimo;
    }

    public function temControleEstoque(): bool
    {
        return $this->estoque_minimo > 0;
    }

    /**
     * Quantidade que falta para atingir o estoque mínimo.
     */
    public function faltaParaMinimo(): float
    {
        $falta = $this->estoque_minimo - $this->estoque_atual;

        return max(0, $falta);
    }
}
