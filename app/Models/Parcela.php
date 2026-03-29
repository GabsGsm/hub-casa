<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Parcela extends Model
{
    use HasFactory;

    protected $table = 'parcelas';

    public const STATUS_ABERTO = 'aberto';
    public const STATUS_PAGO = 'pago';
    public const STATUS_IMPOSSIBILITADO = 'impossibilitado';

    protected $fillable = [
        'parcelamento_id',
        'numero_parcela',
        'valor_parcela',
        'status',
        'vencimento',
    ];

    protected $casts = [
        'valor_parcela'  => 'decimal:2',
        'numero_parcela' => 'integer',
        'vencimento'     => 'date',
    ];

    // -------------------------------------------------------------------------
    // Relacionamentos
    // -------------------------------------------------------------------------

    public function parcelamento(): BelongsTo
    {
        return $this->belongsTo(Parcelamento::class);
    }

    // ── Atalhos via parcelamento (conveniência) ──────────────────────────────

    public function getTituloAttribute(): string
    {
        return $this->parcelamento->titulo;
    }

    public function getCasaIdAttribute(): int
    {
        return $this->parcelamento->casa_id;
    }

    public function getCriadoPorAttribute(): int
    {
        return $this->parcelamento->criado_por;
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    public function estaPaga(): bool
    {
        return $this->status === self::STATUS_PAGO;
    }

    public function estaAberta(): bool
    {
        return $this->status === self::STATUS_ABERTO;
    }
}
