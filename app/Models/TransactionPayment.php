<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TransactionPayment extends Model
{
    protected $fillable = [
        'transaction_id',
        'paid_by',
        'amount',
        'paid_at',
        'installment_number',
        'notes',
    ];

    protected $casts = [
        'paid_at' => 'date',
        'amount'  => 'decimal:2',
    ];

    public function transaction(): BelongsTo
    {
        return $this->belongsTo(FinancialTransaction::class, 'transaction_id');
    }

    public function paidByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'paid_by');
    }
}
