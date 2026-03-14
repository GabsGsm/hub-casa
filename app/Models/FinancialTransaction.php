<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class FinancialTransaction extends Model
{
    use HasFactory;

    public const STATUS_OPEN = 'aberto';
    public const STATUS_PAID = 'pago';
    public const STATUS_IMPOSSIBLE = 'impossibilitado';

    public const TYPE_EXPENSE = 'gasto';
    public const TYPE_INCOME  = 'ganho';
    public const TYPE_DEBT    = 'divida';

    protected $fillable = [
        'house_id',
        'payment_cycle_id',
        'category_id',
        'created_by',
        'title',
        'amount',
        'type',
        'status',
        'due_date',
        'installments_count',
        'last_installment_date',
        'recurrence',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'due_date' => 'date',
        'last_installment_date' => 'date',
    ];

    public function house(): BelongsTo
    {
        return $this->belongsTo(House::class);
    }

    public function cycle(): BelongsTo
    {
        return $this->belongsTo(PaymentCycle::class, 'payment_cycle_id');
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function assignees(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'financial_transaction_user');
    }

    public function isExpense(): bool
    {
        return $this->type !== self::TYPE_INCOME;
    }
}
