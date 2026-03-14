<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PaymentCycle extends Model
{
    use HasFactory;

    protected $fillable = [
        'house_id',
        'user_id',
        'name',
        'day_of_month',
        'expected_amount',
        'recurring',
        'active',
    ];

    protected $casts = [
        'recurring' => 'boolean',
        'active' => 'boolean',
        'expected_amount' => 'decimal:2',
    ];

    public function house(): BelongsTo
    {
        return $this->belongsTo(House::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function transactions(): HasMany
    {
        return $this->hasMany(FinancialTransaction::class);
    }
}
