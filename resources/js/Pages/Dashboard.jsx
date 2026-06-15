import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import axios from 'axios';
import { Head, router } from '@inertiajs/react';
import { useState } from 'react';

const perPageOptions = [10, 20, 30];
const statusOptions = ['Pendente', 'Entregue'];
const statusFilterOptions = [
    { value: 'concluido', label: 'Concluido' },
    { value: 'proximo', label: 'Proximo de terminar' },
    { value: 'alerta', label: 'Em alerta' },
    { value: 'todos', label: 'Todos' },
];

function formatDate(date) {
    if (!date) {
        return '';
    }

    const [year, month, day] = date.split('-');

    return `${day}/${month}/${year}`;
}

function getRowClass(motorista) {
    if (motorista.pedidos === 0) {
        return 'bg-red-50';
    }

    const deliveryRate = motorista.entregas / motorista.pedidos;

    if (deliveryRate === 1) {
        return 'bg-emerald-50';
    }

    if (deliveryRate > 0.5) {
        return 'bg-amber-50';
    }

    return 'bg-red-50';
}

export default function Dashboard({ motoristas, filters }) {
    const [periodStart, setPeriodStart] = useState(filters?.date_start ?? '');
    const [periodEnd, setPeriodEnd] = useState(filters?.date_end ?? '');
    const [draftPeriodStart, setDraftPeriodStart] = useState(
        filters?.date_start ?? '',
    );
    const [draftPeriodEnd, setDraftPeriodEnd] = useState(
        filters?.date_end ?? '',
    );
    const [isPeriodFilterOpen, setIsPeriodFilterOpen] = useState(false);
    const [statusFilter, setStatusFilter] = useState(
        filters?.status_filter ?? '',
    );
    const [isStatusFilterOpen, setIsStatusFilterOpen] = useState(false);
    const [selectedMotorista, setSelectedMotorista] = useState(null);
    const [pedidos, setPedidos] = useState(null);
    const [editedPedidos, setEditedPedidos] = useState([]);
    const [editingAddressId, setEditingAddressId] = useState(null);
    const [isLoadingPedidos, setIsLoadingPedidos] = useState(false);
    const [isSavingPedidos, setIsSavingPedidos] = useState(false);
    const [openStatusPedidoId, setOpenStatusPedidoId] = useState(null);
    const [modalError, setModalError] = useState('');
    const [selectedEntregaMotorista, setSelectedEntregaMotorista] =
        useState(null);
    const [entregas, setEntregas] = useState(null);
    const [editedEntregas, setEditedEntregas] = useState([]);
    const [editingEntregaAddressId, setEditingEntregaAddressId] =
        useState(null);
    const [isLoadingEntregas, setIsLoadingEntregas] = useState(false);
    const [isSavingEntregas, setIsSavingEntregas] = useState(false);
    const [entregasError, setEntregasError] = useState('');

    const rows = motoristas?.data ?? [];
    const currentPage = motoristas?.current_page ?? 1;
    const lastPage = motoristas?.last_page ?? 1;
    const perPage = filters?.per_page ?? 10;
    const total = motoristas?.total ?? 0;
    const rangeLabel =
        total > 0
            ? `${motoristas.from}-${motoristas.to} de ${total}`
            : '0 de 0';
    const currentFilters = {
        ...(periodStart && periodEnd
            ? {
                date_start: periodStart,
                date_end: periodEnd,
            }
            : {}),
        ...(statusFilter && statusFilter !== 'todos'
            ? { status_filter: statusFilter }
            : {}),
    };
    const periodLabel =
        periodStart && periodEnd
            ? `${formatDate(periodStart)} - ${formatDate(periodEnd)}`
            : 'Selecionar periodo...';
    const isPeriodRangeValid =
        draftPeriodStart && draftPeriodEnd && draftPeriodStart <= draftPeriodEnd;
    const statusFilterLabel =
        statusFilterOptions.find((option) => option.value === statusFilter)
            ?.label ?? 'Selecionar status...';

    const pages = Array.from({ length: lastPage }, (_, index) => index + 1);
    const modalRows = editedPedidos;
    const modalCurrentPage = pedidos?.current_page ?? 1;
    const modalLastPage = pedidos?.last_page ?? 1;
    const modalPerPage = pedidos?.per_page ?? 10;
    const modalTotal = pedidos?.total ?? 0;
    const modalRangeLabel =
        modalTotal > 0 ? `${pedidos.from}-${pedidos.to} de ${modalTotal}` : '0 de 0';
    const modalPages = Array.from(
        { length: modalLastPage },
        (_, index) => index + 1,
    );
    const hasChanges =
        pedidos?.data?.some((pedido, index) => {
            const editedPedido = editedPedidos[index];

            return (
                editedPedido &&
                (editedPedido.endereco !== pedido.endereco ||
                    editedPedido.status !== pedido.status)
            );
        }) ?? false;
    const entregaRows = editedEntregas;
    const entregaCurrentPage = entregas?.current_page ?? 1;
    const entregaLastPage = entregas?.last_page ?? 1;
    const entregaPerPage = entregas?.per_page ?? 10;
    const entregaTotal = entregas?.total ?? 0;
    const entregaRangeLabel =
        entregaTotal > 0
            ? `${entregas.from}-${entregas.to} de ${entregaTotal}`
            : '0 de 0';
    const entregaPages = Array.from(
        { length: entregaLastPage },
        (_, index) => index + 1,
    );
    const hasEntregaChanges =
        entregas?.data?.some((entrega, index) => {
            const editedEntrega = editedEntregas[index];

            return (
                editedEntrega && editedEntrega.endereco !== entrega.endereco
            );
        }) ?? false;

    const updatePerPage = (event) => {
        router.get(
            route('dashboard'),
            { ...currentFilters, per_page: event.target.value },
            {
                preserveScroll: true,
                preserveState: true,
            },
        );
    };

    const goToPage = (page) => {
        router.get(
            route('dashboard'),
            { ...currentFilters, page, per_page: perPage },
            {
                preserveScroll: true,
                preserveState: true,
            },
        );
    };

    const refreshList = () => {
        router.get(
            route('dashboard'),
            { ...currentFilters, page: currentPage, per_page: perPage },
            {
                preserveScroll: true,
                preserveState: true,
            },
        );
    };

    const applyPeriodFilter = () => {
        if (!isPeriodRangeValid) {
            return;
        }

        const nextStart = draftPeriodStart;
        const nextEnd = draftPeriodEnd;
        const nextFilters =
            nextStart && nextEnd
                ? {
                    date_start: nextStart,
                    date_end: nextEnd,
                }
                : {};

        setPeriodStart(nextStart);
        setPeriodEnd(nextEnd);
        setIsPeriodFilterOpen(false);

        router.get(
            route('dashboard'),
            {
                ...nextFilters,
                ...(statusFilter && statusFilter !== 'todos'
                    ? { status_filter: statusFilter }
                    : {}),
                per_page: perPage,
            },
            {
                preserveScroll: true,
                preserveState: true,
            },
        );
    };

    const cancelPeriodFilter = () => {
        setDraftPeriodStart(periodStart);
        setDraftPeriodEnd(periodEnd);
        setIsPeriodFilterOpen(false);
    };

    const clearPeriodFilter = () => {
        setPeriodStart('');
        setPeriodEnd('');
        setDraftPeriodStart('');
        setDraftPeriodEnd('');
        setIsPeriodFilterOpen(false);

        router.get(
            route('dashboard'),
            {
                ...(statusFilter ? { status_filter: statusFilter } : {}),
                per_page: perPage,
            },
            {
                preserveScroll: true,
                preserveState: true,
            },
        );
    };

    const applyStatusFilter = (nextStatusFilter) => {
        setStatusFilter(nextStatusFilter);
        setIsStatusFilterOpen(false);

        router.get(
            route('dashboard'),
            {
                ...(periodStart && periodEnd
                    ? {
                        date_start: periodStart,
                        date_end: periodEnd,
                    }
                    : {}),
                ...(nextStatusFilter && nextStatusFilter !== 'todos'
                    ? { status_filter: nextStatusFilter }
                    : {}),
                per_page: perPage,
            },
            {
                preserveScroll: true,
                preserveState: true,
            },
        );
    };

    const loadPedidos = async (
        motorista,
        page = 1,
        nextPerPage = modalPerPage,
    ) => {
        setIsLoadingPedidos(true);
        setModalError('');

        try {
            const response = await axios.get(
                route('motoristas.pedidos.index', motorista.id),
                {
                    params: {
                        ...currentFilters,
                        page,
                        per_page: nextPerPage,
                    },
                },
            );

            setPedidos(response.data);
            setEditedPedidos(response.data.data);
            setEditingAddressId(null);
            setOpenStatusPedidoId(null);
        } catch {
            setModalError('Nao foi possivel carregar os pedidos.');
        } finally {
            setIsLoadingPedidos(false);
        }
    };

    const openPedidosModal = (motorista) => {
        setSelectedMotorista(motorista);
        setPedidos(null);
        setEditedPedidos([]);
        setOpenStatusPedidoId(null);
        loadPedidos(motorista, 1, 10);
    };

    const closePedidosModal = () => {
        setSelectedMotorista(null);
        setPedidos(null);
        setEditedPedidos([]);
        setEditingAddressId(null);
        setOpenStatusPedidoId(null);
        setModalError('');
    };

    const updateModalPerPage = (event) => {
        loadPedidos(selectedMotorista, 1, event.target.value);
    };

    const goToModalPage = (page) => {
        loadPedidos(selectedMotorista, page, modalPerPage);
    };

    const updatePedido = (pedidoId, field, value) => {
        setEditedPedidos((currentPedidos) =>
            currentPedidos.map((pedido) =>
                pedido.id === pedidoId ? { ...pedido, [field]: value } : pedido,
            ),
        );
    };

    const updatePedidoStatus = (pedidoId, status) => {
        updatePedido(pedidoId, 'status', status);
        setOpenStatusPedidoId(null);
    };

    const cancelPedidoChanges = () => {
        setEditedPedidos(pedidos?.data ?? []);
        setEditingAddressId(null);
        setOpenStatusPedidoId(null);
        setModalError('');
    };

    const savePedidoChanges = async () => {
        setIsSavingPedidos(true);
        setModalError('');

        try {
            await axios.put(route('motoristas.pedidos.update', selectedMotorista.id), {
                pedidos: editedPedidos.map(({ id, endereco, status }) => ({
                    id,
                    endereco,
                    status,
                })),
            });

            await loadPedidos(selectedMotorista, modalCurrentPage, modalPerPage);

            router.reload({
                only: ['motoristas'],
                preserveScroll: true,
            });
        } catch {
            setModalError('Nao foi possivel salvar as alteracoes.');
        } finally {
            setIsSavingPedidos(false);
        }
    };

    const loadEntregas = async (
        motorista,
        page = 1,
        nextPerPage = entregaPerPage,
    ) => {
        setIsLoadingEntregas(true);
        setEntregasError('');

        try {
            const response = await axios.get(
                route('motoristas.entregas.index', motorista.id),
                {
                    params: {
                        ...currentFilters,
                        page,
                        per_page: nextPerPage,
                    },
                },
            );

            setEntregas(response.data);
            setEditedEntregas(response.data.data);
            setEditingEntregaAddressId(null);
        } catch {
            setEntregasError('Nao foi possivel carregar as entregas.');
        } finally {
            setIsLoadingEntregas(false);
        }
    };

    const openEntregasModal = (motorista) => {
        setSelectedEntregaMotorista(motorista);
        setEntregas(null);
        setEditedEntregas([]);
        loadEntregas(motorista, 1, 10);
    };

    const closeEntregasModal = () => {
        setSelectedEntregaMotorista(null);
        setEntregas(null);
        setEditedEntregas([]);
        setEditingEntregaAddressId(null);
        setEntregasError('');
    };

    const updateEntregaPerPage = (event) => {
        loadEntregas(selectedEntregaMotorista, 1, event.target.value);
    };

    const goToEntregaPage = (page) => {
        loadEntregas(selectedEntregaMotorista, page, entregaPerPage);
    };

    const updateEntrega = (entregaId, field, value) => {
        setEditedEntregas((currentEntregas) =>
            currentEntregas.map((entrega) =>
                entrega.id === entregaId
                    ? { ...entrega, [field]: value }
                    : entrega,
            ),
        );
    };

    const cancelEntregaChanges = () => {
        setEditedEntregas(entregas?.data ?? []);
        setEditingEntregaAddressId(null);
        setEntregasError('');
    };

    const saveEntregaChanges = async () => {
        setIsSavingEntregas(true);
        setEntregasError('');

        try {
            await axios.put(
                route(
                    'motoristas.entregas.update',
                    selectedEntregaMotorista.id,
                ),
                {
                    entregas: editedEntregas.map(({ id, endereco }) => ({
                        id,
                        endereco,
                    })),
                },
            );

            await loadEntregas(
                selectedEntregaMotorista,
                entregaCurrentPage,
                entregaPerPage,
            );
        } catch {
            setEntregasError('Nao foi possivel salvar as alteracoes.');
        } finally {
            setIsSavingEntregas(false);
        }
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800">
                    Motoristas
                </h2>
            }
        >
            <Head title="Motoristas" />

            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <div className="mb-4 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                        <h3 className="text-lg font-semibold text-gray-900">
                            Filtros
                        </h3>

                        <div className="mt-4 grid gap-4 md:grid-cols-4">
                            <div className="relative">
                                <label
                                    htmlFor="period-filter"
                                    className="mb-2 block text-xs font-medium text-gray-700"
                                >
                                    Data (Periodo)
                                </label>
                                <button
                                    id="period-filter"
                                    type="button"
                                    onClick={() =>
                                        setIsPeriodFilterOpen(
                                            (isOpen) => !isOpen,
                                        )
                                    }
                                    className="flex h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 text-left text-sm text-gray-700 shadow-sm transition hover:bg-gray-50 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                >
                                    <span>{periodLabel}</span>
                                    <span className="text-gray-500">
                                        &#9662;
                                    </span>
                                </button>

                                {isPeriodFilterOpen && (
                                    <div className="absolute left-0 top-[4.5rem] z-40 w-80 rounded-md border border-gray-200 bg-white p-4 shadow-lg">
                                        <div className="grid gap-3">
                                            <div>
                                                <label
                                                    htmlFor="period-start"
                                                    className="mb-1 block text-xs font-medium text-gray-700"
                                                >
                                                    Data inicial
                                                </label>
                                                <input
                                                    id="period-start"
                                                    type="date"
                                                    value={draftPeriodStart}
                                                    onChange={(event) =>
                                                        setDraftPeriodStart(
                                                            event.target.value,
                                                        )
                                                    }
                                                    className="w-full rounded-md border-gray-300 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                                />
                                            </div>

                                            <div>
                                                <label
                                                    htmlFor="period-end"
                                                    className="mb-1 block text-xs font-medium text-gray-700"
                                                >
                                                    Data final
                                                </label>
                                                <input
                                                    id="period-end"
                                                    type="date"
                                                    value={draftPeriodEnd}
                                                    min={draftPeriodStart}
                                                    onChange={(event) =>
                                                        setDraftPeriodEnd(
                                                            event.target.value,
                                                        )
                                                    }
                                                    className="w-full rounded-md border-gray-300 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                                />
                                            </div>
                                        </div>

                                        <div className="mt-4 flex items-center justify-between gap-3">
                                            <button
                                                type="button"
                                                onClick={clearPeriodFilter}
                                                className="text-xs font-medium text-gray-600 transition hover:text-gray-900"
                                            >
                                                Limpar
                                            </button>
                                            <div className="flex gap-3">
                                                <button
                                                    type="button"
                                                    onClick={cancelPeriodFilter}
                                                    className="text-xs font-medium text-blue-700 transition hover:text-blue-900"
                                                >
                                                    Cancelar
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={applyPeriodFilter}
                                                    disabled={!isPeriodRangeValid}
                                                    className="text-xs font-medium text-blue-700 transition hover:text-blue-900 disabled:cursor-not-allowed disabled:text-gray-400"
                                                >
                                                    Aplicar
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="relative">
                                <label
                                    htmlFor="status-filter"
                                    className="mb-2 block text-xs font-medium text-gray-700"
                                >
                                    Status
                                </label>
                                <button
                                    id="status-filter"
                                    type="button"
                                    onClick={() =>
                                        setIsStatusFilterOpen(
                                            (isOpen) => !isOpen,
                                        )
                                    }
                                    className="flex h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 text-left text-sm text-gray-700 shadow-sm transition hover:bg-gray-50 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    aria-haspopup="listbox"
                                    aria-expanded={isStatusFilterOpen}
                                >
                                    <span
                                        className={
                                            statusFilter
                                                ? 'text-gray-800'
                                                : 'text-gray-500'
                                        }
                                    >
                                        {statusFilter
                                            ? statusFilterLabel
                                            : 'Selecionar status...'}
                                    </span>
                                    <span className="text-gray-500">
                                        &#9662;
                                    </span>
                                </button>

                                {isStatusFilterOpen && (
                                    <div
                                        className="absolute left-0 top-[4.5rem] z-40 w-full overflow-hidden rounded-md border border-gray-200 bg-white py-2 shadow-lg"
                                        role="listbox"
                                    >
                                        {statusFilterOptions.map((option) => (
                                            <button
                                                key={
                                                    option.value || 'todos'
                                                }
                                                type="button"
                                                onClick={() =>
                                                    applyStatusFilter(
                                                        option.value,
                                                    )
                                                }
                                                className={`block w-full px-4 py-3 text-left text-sm transition ${
                                                    statusFilter ===
                                                    option.value
                                                        ? 'bg-blue-700 text-white'
                                                        : 'text-gray-800 hover:bg-gray-50'
                                                }`}
                                                role="option"
                                                aria-selected={
                                                    statusFilter ===
                                                    option.value
                                                }
                                            >
                                                {option.label}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="overflow-hidden border border-gray-200 bg-white shadow-sm sm:rounded-lg">
                        <div className="grid gap-4 border-b border-gray-200 px-4 py-4 md:grid-cols-[1fr_auto_1fr] md:items-center">
                            <div className="flex items-center gap-3">
                                <span className="text-sm font-medium text-gray-700">
                                    {rangeLabel}
                                </span>
                                <select
                                    value={perPage}
                                    onChange={updatePerPage}
                                    className="rounded-md border-gray-300 py-2 pl-3 pr-8 text-sm text-gray-700 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    aria-label="Quantidade de registros por pagina"
                                >
                                    {perPageOptions.map((option) => (
                                        <option key={option} value={option}>
                                            {option}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex items-center justify-start gap-2 md:justify-center">
                                <button
                                    type="button"
                                    onClick={() =>
                                        currentPage > 1 &&
                                        goToPage(currentPage - 1)
                                    }
                                    disabled={currentPage === 1}
                                    className="flex h-8 w-8 items-center justify-center rounded-md text-sm font-medium text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-300"
                                    aria-label="Pagina anterior"
                                >
                                    &lt;
                                </button>

                                {pages.map((page) => (
                                    <button
                                        key={page}
                                        type="button"
                                        onClick={() => goToPage(page)}
                                        className={`flex h-9 min-w-9 items-center justify-center rounded-md px-3 text-sm font-medium transition ${
                                            currentPage === page
                                                ? 'bg-gray-100 text-gray-900'
                                                : 'text-gray-700 hover:bg-gray-50'
                                        }`}
                                    >
                                        {page}
                                    </button>
                                ))}

                                <button
                                    type="button"
                                    onClick={() =>
                                        currentPage < lastPage &&
                                        goToPage(currentPage + 1)
                                    }
                                    disabled={currentPage === lastPage}
                                    className="flex h-8 w-8 items-center justify-center rounded-md text-sm font-medium text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-300"
                                    aria-label="Proxima pagina"
                                >
                                    &gt;
                                </button>
                            </div>

                            <div className="flex justify-start md:justify-end">
                                <button
                                    type="button"
                                    onClick={refreshList}
                                    className="inline-flex h-10 items-center justify-center rounded-md bg-blue-700 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-700 focus:ring-offset-2"
                                >
                                    Atualizar
                                </button>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="min-w-full table-fixed border-collapse">
                                <thead className="bg-white">
                                    <tr className="border-b border-gray-200">
                                        <th className="w-1/3 px-6 py-4 text-left text-sm font-semibold text-gray-800">
                                            Nome do Motorista
                                        </th>
                                        <th className="w-1/3 px-6 py-4 text-left text-sm font-semibold text-gray-800">
                                            Pedidos
                                        </th>
                                        <th className="w-1/3 px-6 py-4 text-left text-sm font-semibold text-gray-800">
                                            Entregas
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {rows.map((motorista) => (
                                        <tr
                                            key={motorista.id}
                                            className={getRowClass(motorista)}
                                        >
                                            <td className="whitespace-nowrap px-6 py-5 text-sm font-medium text-gray-800">
                                                {motorista.nome}
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-5 text-sm font-medium">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        openPedidosModal(
                                                            motorista,
                                                        )
                                                    }
                                                    className="text-blue-600 underline underline-offset-2 transition hover:text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2"
                                                >
                                                    {motorista.pedidos}
                                                </button>
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-5 text-sm font-medium">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        openEntregasModal(
                                                            motorista,
                                                        )
                                                    }
                                                    className="text-blue-600 underline underline-offset-2 transition hover:text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2"
                                                >
                                                    {motorista.entregas}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}

                                    {rows.length === 0 && (
                                        <tr>
                                            <td
                                                colSpan="3"
                                                className="px-6 py-10 text-center text-sm text-gray-500"
                                            >
                                                Nenhum motorista encontrado.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {selectedMotorista && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-8">
                    <div className="flex max-h-full w-full max-w-5xl flex-col overflow-hidden rounded-md bg-white shadow-xl">
                        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
                            <h3 className="text-base font-semibold text-gray-900">
                                Pedidos
                            </h3>
                            <button
                                type="button"
                                onClick={closePedidosModal}
                                className="flex h-8 w-8 items-center justify-center rounded-md text-2xl leading-none text-gray-800 transition hover:bg-gray-100"
                                aria-label="Fechar modal"
                            >
                                &times;
                            </button>
                        </div>

                        <div className="overflow-y-auto px-4 py-4">
                            <div className="grid gap-4 border-b border-gray-200 pb-3 md:grid-cols-[1fr_auto_1fr] md:items-center">
                                <div className="flex items-center gap-3">
                                    <span className="text-sm font-medium text-gray-700">
                                        {modalRangeLabel}
                                    </span>
                                    <select
                                        value={modalPerPage}
                                        onChange={updateModalPerPage}
                                        className="rounded-md border-gray-300 py-1.5 pl-3 pr-8 text-xs text-gray-700 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                        aria-label="Quantidade de pedidos por pagina"
                                        disabled={isLoadingPedidos}
                                    >
                                        {perPageOptions.map((option) => (
                                            <option
                                                key={option}
                                                value={option}
                                            >
                                                {option}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="flex items-center justify-start gap-2 md:justify-center">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            modalCurrentPage > 1 &&
                                            goToModalPage(modalCurrentPage - 1)
                                        }
                                        disabled={
                                            modalCurrentPage === 1 ||
                                            isLoadingPedidos
                                        }
                                        className="flex h-8 w-8 items-center justify-center rounded-md text-sm font-medium text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-300"
                                        aria-label="Pagina anterior de pedidos"
                                    >
                                        &lt;
                                    </button>

                                    {modalPages.map((page) => (
                                        <button
                                            key={page}
                                            type="button"
                                            onClick={() => goToModalPage(page)}
                                            disabled={isLoadingPedidos}
                                            className={`flex h-9 min-w-9 items-center justify-center rounded-md px-3 text-sm font-medium transition ${
                                                modalCurrentPage === page
                                                    ? 'bg-gray-100 text-gray-900'
                                                    : 'text-gray-700 hover:bg-gray-50'
                                            }`}
                                        >
                                            {page}
                                        </button>
                                    ))}

                                    <button
                                        type="button"
                                        onClick={() =>
                                            modalCurrentPage < modalLastPage &&
                                            goToModalPage(modalCurrentPage + 1)
                                        }
                                        disabled={
                                            modalCurrentPage ===
                                                modalLastPage ||
                                            isLoadingPedidos
                                        }
                                        className="flex h-8 w-8 items-center justify-center rounded-md text-sm font-medium text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-300"
                                        aria-label="Proxima pagina de pedidos"
                                    >
                                        &gt;
                                    </button>
                                </div>
                            </div>

                            {modalError && (
                                <div className="mt-4 rounded-md bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                                    {modalError}
                                </div>
                            )}

                            <div className="mt-3 overflow-x-auto pb-28">
                                <table className="min-w-full table-fixed border-collapse">
                                    <thead>
                                        <tr className="border-b border-gray-200">
                                            <th className="w-1/5 px-4 py-3 text-left text-xs font-semibold text-gray-800">
                                                Codigo do Pedido
                                            </th>
                                            <th className="w-3/5 px-4 py-3 text-left text-xs font-semibold text-gray-800">
                                                Endereco
                                            </th>
                                            <th className="w-1/5 px-4 py-3 text-left text-xs font-semibold text-gray-800">
                                                Status
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {isLoadingPedidos && (
                                            <tr>
                                                <td
                                                    colSpan="3"
                                                    className="px-4 py-10 text-center text-sm text-gray-500"
                                                >
                                                    Carregando pedidos...
                                                </td>
                                            </tr>
                                        )}

                                        {!isLoadingPedidos &&
                                            modalRows.map((pedido, index) => (
                                                <tr
                                                    key={pedido.id}
                                                    className={
                                                        index % 2 === 0
                                                            ? 'bg-slate-100'
                                                            : 'bg-white'
                                                    }
                                                >
                                                    <td className="whitespace-nowrap px-4 py-3 text-xs font-medium text-gray-800">
                                                        {pedido.codigo}
                                                    </td>
                                                    <td className="px-4 py-3 text-xs text-gray-800">
                                                        <div className="flex min-w-[420px] items-center gap-2">
                                                            {editingAddressId ===
                                                            pedido.id ? (
                                                                <input
                                                                    type="text"
                                                                    value={
                                                                        pedido.endereco
                                                                    }
                                                                    onChange={(
                                                                        event,
                                                                    ) =>
                                                                        updatePedido(
                                                                            pedido.id,
                                                                            'endereco',
                                                                            event
                                                                                .target
                                                                                .value,
                                                                        )
                                                                    }
                                                                    onBlur={() =>
                                                                        setEditingAddressId(
                                                                            null,
                                                                        )
                                                                    }
                                                                    className="w-full rounded-md border-gray-300 text-xs shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                                                    autoFocus
                                                                />
                                                            ) : (
                                                                <span>
                                                                    {
                                                                        pedido.endereco
                                                                    }
                                                                </span>
                                                            )}

                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    setEditingAddressId(
                                                                        pedido.id,
                                                                    )
                                                                }
                                                                className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-blue-700 transition hover:bg-blue-50"
                                                                aria-label={`Editar endereco do pedido ${pedido.codigo}`}
                                                            >
                                                                <svg
                                                                    className="h-4 w-4"
                                                                    viewBox="0 0 20 20"
                                                                    fill="currentColor"
                                                                    aria-hidden="true"
                                                                >
                                                                    <path d="M13.586 3.586a2 2 0 0 1 2.828 2.828l-.793.793-2.828-2.828.793-.793Z" />
                                                                    <path d="m11.379 5.793 2.828 2.828-7.5 7.5H3.879v-2.828l7.5-7.5Z" />
                                                                </svg>
                                                            </button>
                                                        </div>
                                                    </td>
                                                    <td className="relative whitespace-nowrap px-4 py-3 text-xs text-gray-800">
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                setOpenStatusPedidoId(
                                                                    openStatusPedidoId ===
                                                                        pedido.id
                                                                        ? null
                                                                        : pedido.id,
                                                                )
                                                            }
                                                            className="inline-flex min-w-[6rem] items-center justify-between gap-2 rounded-md bg-transparent px-2 py-1 text-left text-xs text-gray-800 transition hover:bg-white/70 focus:outline-none focus:ring-2 focus:ring-blue-600"
                                                            aria-haspopup="listbox"
                                                            aria-expanded={
                                                                openStatusPedidoId ===
                                                                pedido.id
                                                            }
                                                        >
                                                            <span>
                                                                {pedido.status}
                                                            </span>
                                                            <span className="text-blue-700">
                                                                &#9662;
                                                            </span>
                                                        </button>

                                                        {openStatusPedidoId ===
                                                            pedido.id && (
                                                            <div
                                                                className="absolute right-4 top-10 z-50 w-32 overflow-hidden rounded-md border border-gray-200 bg-white py-1 shadow-lg"
                                                                role="listbox"
                                                            >
                                                                {statusOptions.map(
                                                                    (status) => (
                                                                        <button
                                                                            key={
                                                                                status
                                                                            }
                                                                            type="button"
                                                                            onClick={() =>
                                                                                updatePedidoStatus(
                                                                                    pedido.id,
                                                                                    status,
                                                                                )
                                                                            }
                                                                            className={`block w-full px-3 py-2 text-left text-xs transition ${
                                                                                pedido.status ===
                                                                                status
                                                                                    ? 'bg-blue-700 text-white'
                                                                                    : 'text-gray-800 hover:bg-gray-50'
                                                                            }`}
                                                                            role="option"
                                                                            aria-selected={
                                                                                pedido.status ===
                                                                                status
                                                                            }
                                                                        >
                                                                            {
                                                                                status
                                                                            }
                                                                        </button>
                                                                    ),
                                                                )}
                                                            </div>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {hasChanges && (
                            <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3">
                                <button
                                    type="button"
                                    onClick={cancelPedidoChanges}
                                    disabled={isSavingPedidos}
                                    className="inline-flex h-10 items-center justify-center rounded-md border border-gray-300 bg-white px-4 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="button"
                                    onClick={savePedidoChanges}
                                    disabled={isSavingPedidos}
                                    className="inline-flex h-10 items-center justify-center rounded-md bg-blue-700 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {isSavingPedidos
                                        ? 'Salvando...'
                                        : 'Salvar Alteracoes'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {selectedEntregaMotorista && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-8">
                    <div className="flex max-h-full w-full max-w-3xl flex-col overflow-hidden rounded-md bg-white shadow-xl">
                        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
                            <h3 className="text-base font-semibold text-gray-900">
                                Entregas
                            </h3>
                            <button
                                type="button"
                                onClick={closeEntregasModal}
                                className="flex h-8 w-8 items-center justify-center rounded-md text-2xl leading-none text-gray-800 transition hover:bg-gray-100"
                                aria-label="Fechar modal"
                            >
                                &times;
                            </button>
                        </div>

                        <div className="overflow-y-auto px-4 py-4">
                            <div className="grid gap-4 border-b border-gray-200 pb-3 md:grid-cols-[1fr_auto_1fr] md:items-center">
                                <div className="flex items-center gap-3">
                                    <span className="text-sm font-medium text-gray-700">
                                        {entregaRangeLabel}
                                    </span>
                                    <select
                                        value={entregaPerPage}
                                        onChange={updateEntregaPerPage}
                                        className="rounded-md border-gray-300 py-1.5 pl-3 pr-8 text-xs text-gray-700 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                        aria-label="Quantidade de entregas por pagina"
                                        disabled={isLoadingEntregas}
                                    >
                                        {perPageOptions.map((option) => (
                                            <option
                                                key={option}
                                                value={option}
                                            >
                                                {option}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="flex items-center justify-start gap-2 md:justify-center">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            entregaCurrentPage > 1 &&
                                            goToEntregaPage(
                                                entregaCurrentPage - 1,
                                            )
                                        }
                                        disabled={
                                            entregaCurrentPage === 1 ||
                                            isLoadingEntregas
                                        }
                                        className="flex h-8 w-8 items-center justify-center rounded-md text-sm font-medium text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-300"
                                        aria-label="Pagina anterior de entregas"
                                    >
                                        &lt;
                                    </button>

                                    {entregaPages.map((page) => (
                                        <button
                                            key={page}
                                            type="button"
                                            onClick={() =>
                                                goToEntregaPage(page)
                                            }
                                            disabled={isLoadingEntregas}
                                            className={`flex h-9 min-w-9 items-center justify-center rounded-md px-3 text-sm font-medium transition ${
                                                entregaCurrentPage === page
                                                    ? 'bg-gray-100 text-gray-900'
                                                    : 'text-gray-700 hover:bg-gray-50'
                                            }`}
                                        >
                                            {page}
                                        </button>
                                    ))}

                                    <button
                                        type="button"
                                        onClick={() =>
                                            entregaCurrentPage <
                                                entregaLastPage &&
                                            goToEntregaPage(
                                                entregaCurrentPage + 1,
                                            )
                                        }
                                        disabled={
                                            entregaCurrentPage ===
                                                entregaLastPage ||
                                            isLoadingEntregas
                                        }
                                        className="flex h-8 w-8 items-center justify-center rounded-md text-sm font-medium text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-300"
                                        aria-label="Proxima pagina de entregas"
                                    >
                                        &gt;
                                    </button>
                                </div>
                            </div>

                            {entregasError && (
                                <div className="mt-4 rounded-md bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                                    {entregasError}
                                </div>
                            )}

                            <div className="mt-3 overflow-x-auto">
                                <table className="min-w-full table-fixed border-collapse">
                                    <thead>
                                        <tr className="border-b border-gray-200">
                                            <th className="w-1/5 px-4 py-3 text-left text-xs font-semibold text-gray-800">
                                                Codigo do Pedido
                                            </th>
                                            <th className="w-2/5 px-4 py-3 text-left text-xs font-semibold text-gray-800">
                                                Endereco
                                            </th>
                                            <th className="w-2/5 px-4 py-3 text-left text-xs font-semibold text-gray-800">
                                                Data e Horario da Entrega
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {isLoadingEntregas && (
                                            <tr>
                                                <td
                                                    colSpan="3"
                                                    className="px-4 py-10 text-center text-sm text-gray-500"
                                                >
                                                    Carregando entregas...
                                                </td>
                                            </tr>
                                        )}

                                        {!isLoadingEntregas &&
                                            entregaRows.map(
                                                (entrega, index) => (
                                                    <tr
                                                        key={entrega.id}
                                                        className={
                                                            index % 2 === 0
                                                                ? 'bg-slate-100'
                                                                : 'bg-white'
                                                        }
                                                    >
                                                        <td className="whitespace-nowrap px-4 py-3 text-xs font-medium text-gray-800">
                                                            {entrega.codigo}
                                                        </td>
                                                        <td className="px-4 py-3 text-xs text-gray-800">
                                                            <div className="flex min-w-[300px] items-center gap-2">
                                                                {editingEntregaAddressId ===
                                                                entrega.id ? (
                                                                    <input
                                                                        type="text"
                                                                        value={
                                                                            entrega.endereco
                                                                        }
                                                                        onChange={(
                                                                            event,
                                                                        ) =>
                                                                            updateEntrega(
                                                                                entrega.id,
                                                                                'endereco',
                                                                                event
                                                                                    .target
                                                                                    .value,
                                                                            )
                                                                        }
                                                                        onBlur={() =>
                                                                            setEditingEntregaAddressId(
                                                                                null,
                                                                            )
                                                                        }
                                                                        className="w-full rounded-md border-gray-300 text-xs shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                                                        autoFocus
                                                                    />
                                                                ) : (
                                                                    <span>
                                                                        {
                                                                            entrega.endereco
                                                                        }
                                                                    </span>
                                                                )}

                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        setEditingEntregaAddressId(
                                                                            entrega.id,
                                                                        )
                                                                    }
                                                                    className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-blue-700 transition hover:bg-blue-50"
                                                                    aria-label={`Editar endereco da entrega ${entrega.codigo}`}
                                                                >
                                                                    <svg
                                                                        className="h-4 w-4"
                                                                        viewBox="0 0 20 20"
                                                                        fill="currentColor"
                                                                        aria-hidden="true"
                                                                    >
                                                                        <path d="M13.586 3.586a2 2 0 0 1 2.828 2.828l-.793.793-2.828-2.828.793-.793Z" />
                                                                        <path d="m11.379 5.793 2.828 2.828-7.5 7.5H3.879v-2.828l7.5-7.5Z" />
                                                                    </svg>
                                                                </button>
                                                            </div>
                                                        </td>
                                                        <td className="whitespace-nowrap px-4 py-3 text-xs text-gray-800">
                                                            {
                                                                entrega.entregue_em
                                                            }
                                                        </td>
                                                    </tr>
                                                ),
                                            )}

                                        {!isLoadingEntregas &&
                                            entregaRows.length === 0 && (
                                                <tr>
                                                    <td
                                                        colSpan="3"
                                                        className="px-4 py-10 text-center text-sm text-gray-500"
                                                    >
                                                        Nenhuma entrega encontrada.
                                                    </td>
                                                </tr>
                                            )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {hasEntregaChanges && (
                            <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3">
                                <button
                                    type="button"
                                    onClick={cancelEntregaChanges}
                                    disabled={isSavingEntregas}
                                    className="inline-flex h-10 items-center justify-center rounded-md border border-gray-300 bg-white px-4 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="button"
                                    onClick={saveEntregaChanges}
                                    disabled={isSavingEntregas}
                                    className="inline-flex h-10 items-center justify-center rounded-md bg-blue-700 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {isSavingEntregas
                                        ? 'Salvando...'
                                        : 'Salvar Alteracoes'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
