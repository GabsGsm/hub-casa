<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ItemCompra extends Model
{
    use HasFactory;

    protected $table = 'lista_compras';

    public const STATUS_PENDENTE = 'pendente';
    public const STATUS_COMPLETO = 'completo';
    public const STATUS_CANCELADO = 'cancelado';

    protected $fillable = [
        'produto_id',
        'criado_por',
        'quantidade_desejada',
        'quantidade_comprada',
        'status',
        'observacoes',
    ];

    protected $casts = [
        'quantidade_desejada' => 'decimal:2',
        'quantidade_comprada' => 'decimal:2',
    ];

    // -------------------------------------------------------------------------
    // Relacionamentos
    // -------------------------------------------------------------------------

    public function produto(): BelongsTo
    {
        return $this->belongsTo(Produto::class);
    }

    public function criador(): BelongsTo
    {
        return $this->belongsTo(User::class, 'criado_por');
    }

    // ── Atalhos via produto ──────────────────────────────────────────────────

    public function getCasaIdAttribute(): int
    {
        return $this->produto->casa_id;
    }

    public function getCriadoPorProdutoAttribute(): int
    {
        return $this->produto->criado_por;
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    public function progresso(): float
    {
        if ($this->quantidade_desejada <= 0) {
            return 100;
        }

        return min(100, ($this->quantidade_comprada / $this->quantidade_desejada) * 100);
    }

    public function falta(): float
    {
        return max(0, $this->quantidade_desejada - $this->quantidade_comprada);
    }

    public function estaCompleto(): bool
    {
        return $this->status === self::STATUS_COMPLETO;
    }

    public function estaPendente(): bool
    {
        return $this->status === self::STATUS_PENDENTE;
    }

    /**
     * Registra uma compra parcial ou completa.
     * Atualiza o estoque do produto automaticamente.
     */
    public function registrarCompra(float $quantidadeComprada): void
    {
        $this->quantidade_comprada += $quantidadeComprada;

        // Atualiza o estoque do produto
        $produto = $this->produto;
        $produto->estoque_atual += $quantidadeComprada;
        $produto->save();

        // Marca como completo se atingiu a quantidade desejada
        if ($this->quantidade_comprada >= $this->quantidade_desejada) {
            $this->status = self::STATUS_COMPLETO;
        }

        $this->save();
    }
}
