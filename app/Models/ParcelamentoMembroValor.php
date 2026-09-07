<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ParcelamentoMembroValor extends Model
{
    protected $table = 'parcelamento_membro_valor';

    protected $fillable = [
        'parcelamento_id',
        'user_id',
        'valor',
        'status',
        'ciclo_id',
    ];

    public function parcelamento(): BelongsTo
    {
        return $this->belongsTo(Parcelamento::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function ciclo(): BelongsTo
    {
        return $this->belongsTo(PaymentCycle::class, 'ciclo_id');
    }
}
