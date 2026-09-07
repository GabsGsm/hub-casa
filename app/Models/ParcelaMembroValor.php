<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ParcelaMembroValor extends Model
{
    protected $table = 'parcela_membro_valor';

    protected $fillable = [
        'parcela_id',
        'user_id',
        'valor',
        'status',
        'ciclo_id',
    ];

    public function parcela(): BelongsTo
    {
        return $this->belongsTo(Parcela::class);
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
