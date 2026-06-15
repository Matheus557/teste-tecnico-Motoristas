<?php

namespace App\Http\Controllers;

use App\Models\Motorista;
use App\Models\Pedido;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;

class MotoristaController extends Controller
{
    public function index(Request $request): Response
    {
        $perPage = $request->integer('per_page', 10);

        if (! in_array($perPage, [10, 20, 30], true)) {
            $perPage = 10;
        }

        $statusFilter = $request->string('status_filter')->toString();
        $allowedStatusFilters = ['concluido', 'proximo', 'alerta'];

        if (! in_array($statusFilter, $allowedStatusFilters, true)) {
            $statusFilter = null;
        }

        $dateStart = $request->date('date_start');
        $dateEnd = $request->date('date_end');
        $period = $dateStart && $dateEnd
            ? [
                $dateStart->copy()->startOfDay(),
                $dateEnd->copy()->endOfDay(),
            ]
            : null;

        $motoristas = Motorista::query()
            ->select(['id', 'nome'])
            ->withCount([
                'pedidos' => fn ($query) => $period
                    ? $query->whereBetween('solicitado_em', $period)
                    : $query,
            ])
            ->withCount([
                'pedidos as entregas_count' => fn ($query) => $query
                    ->when(
                        $period,
                        fn ($query) => $query->whereBetween('solicitado_em', $period),
                    )
                    ->where('status', Pedido::STATUS_ENTREGUE),
            ])
            ->when($statusFilter, function ($query) use ($statusFilter): void {
                match ($statusFilter) {
                    'concluido' => $query
                        ->having('pedidos_count', '>', 0)
                        ->havingRaw('entregas_count = pedidos_count'),
                    'proximo' => $query
                        ->havingRaw('entregas_count < pedidos_count')
                        ->havingRaw('entregas_count > pedidos_count / 2'),
                    'alerta' => $query
                        ->havingRaw('(pedidos_count = 0 OR entregas_count <= pedidos_count / 2)'),
                };
            })
            ->orderBy('id')
            ->paginate($perPage)
            ->withQueryString()
            ->through(fn (Motorista $motorista) => [
                'id' => $motorista->id,
                'nome' => $motorista->nome,
                'pedidos' => (int) $motorista->pedidos_count,
                'entregas' => (int) $motorista->entregas_count,
            ]);

        return Inertia::render('Dashboard', [
            'motoristas' => $motoristas,
            'filters' => [
                'per_page' => $perPage,
                'date_start' => $dateStart instanceof Carbon
                    ? $dateStart->toDateString()
                    : null,
                'date_end' => $dateEnd instanceof Carbon
                    ? $dateEnd->toDateString()
                    : null,
                'status_filter' => $statusFilter,
            ],
        ]);
    }
}
