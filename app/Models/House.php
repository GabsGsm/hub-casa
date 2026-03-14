<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class House extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'description',
        'status',
    ];

    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    public function paymentCycles(): HasMany
    {
        return $this->hasMany(PaymentCycle::class);
    }

    public function categories(): HasMany
    {
        return $this->hasMany(Category::class);
    }

    public function financialTransactions(): HasMany
    {
        return $this->hasMany(FinancialTransaction::class);
    }

    public function tasks(): HasMany
    {
        return $this->hasMany(Task::class);
    }

    public function agendaEvents(): HasMany
    {
        return $this->hasMany(AgendaEvent::class);
    }

    public function shoppingLists(): HasMany
    {
        return $this->hasMany(ShoppingList::class);
    }

    public function pantryItems(): HasMany
    {
        return $this->hasMany(PantryItem::class);
    }
}
