<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['motorista_id', 'codigo', 'endereco', 'status', 'solicitado_em', 'entregue_em'])]
class Pedido extends Model
{
    use HasFactory;

    public const STATUS_PENDENTE = 'Pendente';

    public const STATUS_ENTREGUE = 'Entregue';

    public function motorista(): BelongsTo
    {
        return $this->belongsTo(Motorista::class);
    }

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'solicitado_em' => 'datetime',
            'entregue_em' => 'datetime',
        ];
    }
}
