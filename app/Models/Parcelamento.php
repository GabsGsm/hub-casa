<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Parcelamento extends Model
{
    use HasFactory;

    protected $table = 'parcelamentos';

    protected $fillable = [
        'casa_id',
        'ciclo_id',
        'categoria_id',
        'criado_por',
        'titulo',
        'valor_total',
        'total_parcelas',
        'observacoes',
    ];

    protected $casts = [
        'valor_total'    => 'decimal:2',
        'total_parcelas' => 'integer',
    ];

    // -------------------------------------------------------------------------
    // Relacionamentos
    // -------------------------------------------------------------------------

    public function casa(): BelongsTo
    {
        return $this->belongsTo(House::class, 'casa_id');
    }

    public function ciclo(): BelongsTo
    {
        return $this->belongsTo(PaymentCycle::class, 'ciclo_id');
    }

    public function categoria(): BelongsTo
    {
        return $this->belongsTo(Category::class, 'categoria_id');
    }

    public function criador(): BelongsTo
    {
        return $this->belongsTo(User::class, 'criado_por');
    }

    public function responsaveis(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'parcelamento_usuario', 'parcelamento_id', 'user_id');
    }

    public function parcelas(): HasMany
    {
        return $this->hasMany(Parcela::class)->orderBy('numero_parcela');
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    public function totalPago(): float
    {
        return (float) $this->parcelas()->where('status', Parcela::STATUS_PAGO)->sum('valor_parcela');
    }

    public function totalAberto(): float
    {
        return (float) $this->parcelas()->where('status', Parcela::STATUS_ABERTO)->sum('valor_parcela');
    }

    public function parcelasPagas(): int
    {
        return $this->parcelas()->where('status', Parcela::STATUS_PAGO)->count();
    }
}
