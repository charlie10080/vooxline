import React, { useState } from 'react';
import { useAdminContext } from '@/layouts/adminContext';

interface UserItem {
  id: string;
  name: string;
  email: string;
  avatar: string;
  level: string;
  campaign: string;
  campaignColor: string;
  workgroup: string;
  workgroupColor: string;
  status: 'active' | 'inactive';
  extension: string;
  joinDate: string;
}

export const AdminUsersPage: React.FC = () => {
  const context = useAdminContext();
  const lang = context?.lang || 'es';

  // 1. Buscador y Filtro de Estado
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // 2. Directorio de Usuarios
  const [users, setUsers] = useState<UserItem[]>([
    {
      id: 'VX-9921',
      name: 'María López',
      email: 'm.lopez@vooxline.com',
      avatar:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuCvPHa2-jP_RD3Rw4IZarjza8VKRGTSWHQ2JAf6K4SLDQwrws4qpvLS_GJV43z2ZST7YJDUJ20BhPHgnfwiog9mxbXJ7a9zBe_fN01OFyA8TlFkX1dFseb0pf0I9Y7FWjY7oQp6vO0xs-p9qMPpO4KLEuzHu1kKdLtFSBtgfK55Qhe2BPzsDcP-qbttY-IJf8YX1_b9Rhe5GD-czukEgEx0zRbBaTs5_WEY44gof8TIId1lTndygSQ',
      level: 'Senior Specialist L2',
      campaign: 'National Assemblers Inc',
      campaignColor: 'text-primary border-primary/30 bg-primary/10',
      workgroup: 'Retención & Ventas VIP',
      workgroupColor: 'bg-primary/10 text-primary border-primary/20',
      status: 'active',
      extension: '1041',
      joinDate: '15 Ene 2023',
    },
    {
      id: 'VX-8812',
      name: 'Carlos Mendoza',
      email: 'c.mendoza@vooxline.com',
      avatar:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuCsLwy9wHR5oLLswlB1RHIMt_PodeMAGKE-NN4L4csUIFGFDe_yOrACn__rpwOi0jOSDq0w_ZMKZXy84e_gGaZGMUEd1bTxHeNC3vdXeCsWs2ZgnYRVhsBOGPA0iifoh9yjwiFtVlsxzqxAEusfsdA_FogodrpnrmpgkUtdGY7M0yYNzyEzUjuP8S7MrSUUdutGHIFsJqIA0Y6zvM78Z_EWZqCeSbCV0KLiNW5CqofS5i3iVp_1eKI',
      level: 'Support Rep L1',
      campaign: 'Fidelis Health Support',
      campaignColor: 'text-secondary border-secondary/30 bg-secondary/10',
      workgroup: 'Soporte Nivel 1',
      workgroupColor: 'bg-secondary/10 text-secondary border-secondary/20',
      status: 'active',
      extension: '1042',
      joinDate: '02 Mar 2023',
    },
    {
      id: 'VX-7734',
      name: 'Valeria Ríos',
      email: 'v.rios@vooxline.com',
      avatar:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuDonmzzHjPmHRBRorZPnhpKrar_ngyMMJHjOGi8b7gpKKlfhSx2O2nwepoY8dtIQwBHbDVMhUZgg-bWcqA6mr-NgHZk3oUPD_w2ULo4_3SWtsxNM7Ynw2lwrZsj0CqzhoBF5sifHYPbO3WzzkbTHyJ950nAg3p7HUpYm1V8khO0FxQoeuYZCnP43A3LldKABFz9Atmtj9-_HvPK5_pBMPXl_ANWwvkYgwdmJQGPkln7k10mPSap5tA',
      level: 'Lead Retención L3',
      campaign: 'NexPay Fintech VIP',
      campaignColor: 'text-amber-400 border-amber-400/30 bg-amber-400/10',
      workgroup: 'QA & Compliance',
      workgroupColor: 'bg-amber-400/10 text-amber-400 border-amber-400/20',
      status: 'active',
      extension: '1043',
      joinDate: '10 Nov 2022',
    },
    {
      id: 'VX-4109',
      name: 'Alejandro Sterling',
      email: 'a.sterling@vooxline.com',
      avatar:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuDFHk7nFqPz41j5h0w0814Mv_s71A2t0Z8xK9wJ1b89-21q6sO4b7f8L5g4bK7fA3pB9qY9=s96-c',
      level: 'B2B Executive Ops',
      campaign: 'Enterprise Solutions',
      campaignColor: 'text-purple-400 border-purple-400/30 bg-purple-400/10',
      workgroup: 'Supervisión de Nodos',
      workgroupColor: 'bg-purple-400/10 text-purple-400 border-purple-400/20',
      status: 'active',
      extension: '1001',
      joinDate: '01 Ene 2022',
    },
    {
      id: 'VX-6520',
      name: 'David Morales',
      email: 'd.morales@vooxline.com',
      avatar:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuDonmzzHjPmHRBRorZPnhpKrar_ngyMMJHjOGi8b7gpKKlfhSx2O2nwepoY8dtIQwBHbDVMhUZgg-bWcqA6mr-NgHZk3oUPD_w2ULo4_3SWtsxNM7Ynw2lwrZsj0CqzhoBF5sifHYPbO3WzzkbTHyJ950nAg3p7HUpYm1V8khO0FxQoeuYZCnP43A3LldKABFz9Atmtj9-_HvPK5_pBMPXl_ANWwvkYgwdmJQGPkln7k10mPSap5tA',
      level: 'ACD Specialist L1',
      campaign: 'National Assemblers Inc',
      campaignColor: 'text-primary border-primary/30 bg-primary/10',
      workgroup: 'Soporte Nivel 1',
      workgroupColor: 'bg-secondary/10 text-secondary border-secondary/20',
      status: 'inactive',
      extension: '1044',
      joinDate: '18 Jul 2023',
    },
    {
      id: 'VX-5211',
      name: 'Sofía Navarro',
      email: 's.navarro@vooxline.com',
      avatar:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuCvPHa2-jP_RD3Rw4IZarjza8VKRGTSWHQ2JAf6K4SLDQwrws4qpvLS_GJV43z2ZST7YJDUJ20BhPHgnfwiog9mxbXJ7a9zBe_fN01OFyA8TlFkX1dFseb0pf0I9Y7FWjY7oQp6vO0xs-p9qMPpO4KLEuzHu1kKdLtFSBtgfK55Qhe2BPzsDcP-qbttY-IJf8YX1_b9Rhe5GD-czukEgEx0zRbBaTs5_WEY44gof8TIId1lTndygSQ',
      level: 'Bilingual Care L2',
      campaign: 'Fidelis Health Support',
      campaignColor: 'text-secondary border-secondary/30 bg-secondary/10',
      workgroup: 'Retención & Ventas VIP',
      workgroupColor: 'bg-primary/10 text-primary border-primary/20',
      status: 'active',
      extension: '1045',
      joinDate: '05 Sep 2023',
    },
    {
      id: 'VX-3390',
      name: 'Alejandra Moreno',
      email: 'a.moreno@vooxline.com',
      avatar:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuCsLwy9wHR5oLLswlB1RHIMt_PodeMAGKE-NN4L4csUIFGFDe_yOrACn__rpwOi0jOSDq0w_ZMKZXy84e_gGaZGMUEd1bTxHeNC3vdXeCsWs2ZgnYRVhsBOGPA0iifoh9yjwiFtVlsxzqxAEusfsdA_FogodrpnrmpgkUtdGY7M0yYNzyEzUjuP8S7MrSUUdutGHIFsJqIA0Y6zvM78Z_EWZqCeSbCV0KLiNW5CqofS5i3iVp_1eKI',
      level: 'Support Rep L1',
      campaign: 'Retail Express VIP',
      campaignColor: 'text-emerald-400 border-emerald-400/30 bg-emerald-400/10',
      workgroup: 'Soporte Nivel 1',
      workgroupColor: 'bg-secondary/10 text-secondary border-secondary/20',
      status: 'active',
      extension: '1046',
      joinDate: '12 Ene 2024',
    },
  ]);

  // Form State para Modal "Añadir Usuario"
  const [newUserData, setNewUserData] = useState({
    name: '',
    email: '',
    level: 'Support Rep L1',
    campaign: 'National Assemblers Inc',
    workgroup: 'Soporte Nivel 1',
  });

  const handleToggleStatus = (id: string) => {
    setUsers((prev) =>
      prev.map((user) => {
        if (user.id === id) {
          return { ...user, status: user.status === 'active' ? 'inactive' : 'active' };
        }
        return user;
      })
    );
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserData.name.trim() || !newUserData.email.trim()) return;

    const randomId = `VX-${Math.floor(1000 + Math.random() * 9000)}`;
    const randomExt = `${Math.floor(1040 + Math.random() * 50)}`;

    const newUser: UserItem = {
      id: randomId,
      name: newUserData.name,
      email: newUserData.email,
      avatar:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuCsLwy9wHR5oLLswlB1RHIMt_PodeMAGKE-NN4L4csUIFGFDe_yOrACn__rpwOi0jOSDq0w_ZMKZXy84e_gGaZGMUEd1bTxHeNC3vdXeCsWs2ZgnYRVhsBOGPA0iifoh9yjwiFtVlsxzqxAEusfsdA_FogodrpnrmpgkUtdGY7M0yYNzyEzUjuP8S7MrSUUdutGHIFsJqIA0Y6zvM78Z_EWZqCeSbCV0KLiNW5CqofS5i3iVp_1eKI',
      level: newUserData.level,
      campaign: newUserData.campaign,
      campaignColor: 'text-primary border-primary/30 bg-primary/10',
      workgroup: newUserData.workgroup,
      workgroupColor: 'bg-primary/10 text-primary border-primary/20',
      status: 'active',
      extension: randomExt,
      joinDate: 'Hoy',
    };

    setUsers((prev) => [newUser, ...prev]);
    setIsAddModalOpen(false);
    setNewUserData({
      name: '',
      email: '',
      level: 'Support Rep L1',
      campaign: 'National Assemblers Inc',
      workgroup: 'Soporte Nivel 1',
    });
  };

  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.id.toLowerCase().includes(q) ||
      u.campaign.toLowerCase().includes(q) ||
      u.workgroup.toLowerCase().includes(q);

    if (statusFilter === 'active') return matchesSearch && u.status === 'active';
    if (statusFilter === 'inactive') return matchesSearch && u.status === 'inactive';
    return matchesSearch;
  });

  return (
    <main className="w-full pt-24 px-space-lg pb-space-xl bg-[#0B0C10] min-h-screen text-on-surface">
      <div className="flex flex-col gap-space-lg max-w-[1600px] mx-auto">
        {/* Page Header: Buscador de agentes y Botón principal masivo en verde neón (+ Añadir Usuario) */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-md p-space-lg rounded-2xl bg-surface-container-low/70 backdrop-blur-xl border border-white/10 shadow-[0_12px_32px_rgba(0,0,0,0.6)]">
          <div className="flex items-center gap-space-md">
            <div className="w-12 h-12 rounded-xl bg-surface-container-high flex items-center justify-center text-primary shadow-[0_0_24px_rgba(102,252,241,0.3)] border border-primary/20">
              <span className="material-symbols-outlined text-[28px]">group</span>
            </div>
            <div>
              <div className="flex items-center gap-space-xs">
                <h1 className="font-headline-sm text-headline-sm font-bold text-on-surface">
                  {lang === 'es' ? 'Directorio y Gestión de Talento' : 'Agent Directory & Talent Management'}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 font-label-code text-[11px] font-bold">
                  {users.length} {lang === 'es' ? 'Agentes' : 'Agents'}
                </span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                {lang === 'es'
                  ? 'Administración de perfiles, asignación de campañas B2B, grupos de trabajo y credenciales SIP.'
                  : 'Manage agent profiles, B2B campaign assignments, workgroups, and SIP credentials.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-space-md flex-wrap">
            {/* Buscador de Agentes */}
            <div className="relative w-full sm:w-72">
              <span className="material-symbols-outlined absolute left-3 top-2.5 text-on-surface-variant text-[18px]">
                search
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={lang === 'es' ? 'Buscar por nombre, ID, grupo...' : 'Search by name, ID, group...'}
                className="w-full bg-[#13151c] text-on-surface placeholder:text-on-surface-variant pl-10 pr-space-md py-2.5 rounded-xl font-body-sm text-body-sm focus:outline-none focus:ring-1 focus:ring-primary/40 border border-white/10"
              />
            </div>

            {/* Botón Principal Masivo en Verde Neón: + Añadir Usuario */}
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-2 px-space-lg py-2.5 rounded-xl bg-primary text-black font-bold font-label-tag text-sm shadow-[0_0_24px_rgba(102,252,241,0.4)] hover:shadow-[0_0_36px_rgba(102,252,241,0.6)] hover:brightness-110 transition-all cursor-pointer transform active:scale-95"
            >
              <span className="material-symbols-outlined text-[20px]">person_add</span>
              <span>{lang === 'es' ? '+ Añadir Usuario' : '+ Add User'}</span>
            </button>
          </div>
        </div>

        {/* Barra de Filtros Rápidos (Todos, Activos, Inactivos) */}
        <div className="flex items-center justify-between gap-space-sm flex-wrap">
          <div className="flex items-center gap-2 p-1 bg-[#13151c] rounded-xl border border-white/10 shadow-inner">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-4 py-1.5 rounded-lg text-xs font-label-tag font-bold transition-all cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-primary text-on-primary shadow-[0_0_12px_rgba(102,252,241,0.4)]'
                  : 'text-on-surface-variant hover:text-white'
              }`}
            >
              {lang === 'es' ? 'Todos los Estados' : 'All States'} ({users.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('active')}
              className={`px-4 py-1.5 rounded-lg text-xs font-label-tag font-bold transition-all cursor-pointer ${
                statusFilter === 'active'
                  ? 'bg-primary text-on-primary shadow-[0_0_12px_rgba(102,252,241,0.4)]'
                  : 'text-on-surface-variant hover:text-white'
              }`}
            >
              {lang === 'es' ? 'Activos' : 'Active'} ({users.filter((u) => u.status === 'active').length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('inactive')}
              className={`px-4 py-1.5 rounded-lg text-xs font-label-tag font-bold transition-all cursor-pointer ${
                statusFilter === 'inactive'
                  ? 'bg-primary text-on-primary shadow-[0_0_12px_rgba(102,252,241,0.4)]'
                  : 'text-on-surface-variant hover:text-white'
              }`}
            >
              {lang === 'es' ? 'Inactivos' : 'Inactive'} ({users.filter((u) => u.status === 'inactive').length})
            </button>
          </div>

          <span className="font-label-code text-xs text-on-surface-variant">
            {lang === 'es' ? 'Mostrando' : 'Showing'} {filteredUsers.length} {lang === 'es' ? 'de' : 'of'} {users.length} {lang === 'es' ? 'usuarios' : 'users'}
          </span>
        </div>

        {/* Tabla: Agente & Nivel, Campaña Asignada, Grupo de Trabajo, Estado de Cuenta */}
        <div className="bg-surface-container-low/80 backdrop-blur-xl p-space-lg rounded-2xl border border-white/10 shadow-[0_12px_32px_rgba(0,0,0,0.6)] flex flex-col gap-space-md">
          <div className="overflow-x-auto">
            <table className="w-full text-left font-body-sm text-body-sm">
              <thead>
                <tr className="bg-surface-container-high/40 text-on-surface-variant font-label-code text-label-code uppercase tracking-wider border-b border-white/5">
                  <th className="py-space-md px-space-sm rounded-l-xl">
                    {lang === 'es' ? 'Agente & Nivel' : 'Agent & Level'}
                  </th>
                  <th className="py-space-md px-space-sm">
                    {lang === 'es' ? 'Campaña Asignada' : 'Assigned Campaign'}
                  </th>
                  <th className="py-space-md px-space-sm">
                    {lang === 'es' ? 'Grupo de Trabajo' : 'Workgroup'}
                  </th>
                  <th className="py-space-md px-space-sm text-center">
                    {lang === 'es' ? 'Extensión SIP' : 'SIP Ext'}
                  </th>
                  <th className="py-space-md px-space-sm text-center">
                    {lang === 'es' ? 'Estado de Cuenta' : 'Account Status'}
                  </th>
                  <th className="py-space-md px-space-sm text-center rounded-r-xl">
                    {lang === 'es' ? 'Acciones' : 'Actions'}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-on-surface">
                {filteredUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-surface-container-high/40 transition-colors group"
                  >
                    {/* Agente & Nivel con Foto de Perfil */}
                    <td className="py-space-md px-space-sm">
                      <div className="flex items-center gap-space-sm">
                        <img
                          src={user.avatar}
                          alt={user.name}
                          className="w-11 h-11 rounded-full object-cover shadow-[0_0_12px_rgba(0,0,0,0.6)] border border-white/10"
                        />
                        <div className="flex flex-col">
                          <span className="font-semibold text-on-surface group-hover:text-primary transition-colors text-sm">
                            {user.name}
                          </span>
                          <span className="font-label-code text-xs text-secondary">
                            {user.email}
                          </span>
                          <span className="font-label-tag text-[11px] text-on-surface-variant opacity-80 mt-0.5">
                            {user.level} • {user.id}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Campaña Asignada */}
                    <td className="py-space-md px-space-sm">
                      <span
                        className={`px-3 py-1 rounded-full font-label-tag text-xs font-semibold border ${user.campaignColor}`}
                      >
                        {user.campaign}
                      </span>
                    </td>

                    {/* Grupo de Trabajo */}
                    <td className="py-space-md px-space-sm">
                      <span
                        className={`px-3 py-1 rounded-full font-label-tag text-xs font-semibold border ${user.workgroupColor}`}
                      >
                        {user.workgroup}
                      </span>
                    </td>

                    {/* Extensión SIP */}
                    <td className="py-space-md px-space-sm text-center">
                      <span className="px-2.5 py-1 rounded bg-surface-container-high font-mono font-semibold text-xs text-primary border border-white/5">
                        {user.extension}
                      </span>
                    </td>

                    {/* Estado de Cuenta (Activo / Inactivo con Toggle) */}
                    <td className="py-space-md px-space-sm text-center">
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(user.id)}
                        title={lang === 'es' ? 'Clic para alternar estado' : 'Click to toggle status'}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-label-tag text-xs font-bold transition-all cursor-pointer ${
                          user.status === 'active'
                            ? 'bg-primary/10 text-primary border border-primary/30 shadow-[0_0_12px_rgba(102,252,241,0.2)] hover:bg-primary/20'
                            : 'bg-white/5 text-on-surface-variant border border-white/10 hover:bg-white/10'
                        }`}
                      >
                        <span
                          className={`w-2 h-2 rounded-full ${
                            user.status === 'active' ? 'bg-primary animate-pulse' : 'bg-gray-500'
                          }`}
                        />
                        {user.status === 'active'
                          ? lang === 'es'
                            ? 'Activo'
                            : 'Active'
                          : lang === 'es'
                          ? 'Inactivo'
                          : 'Inactive'}
                      </button>
                    </td>

                    {/* Acciones */}
                    <td className="py-space-md px-space-sm text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          title={lang === 'es' ? 'Editar Perfil' : 'Edit Profile'}
                          className="p-1.5 rounded-lg bg-surface-container-high hover:bg-primary/20 text-on-surface-variant hover:text-primary transition-all cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[18px]">edit</span>
                        </button>
                        <button
                          type="button"
                          title={lang === 'es' ? 'Credenciales SIP' : 'SIP Credentials'}
                          className="p-1.5 rounded-lg bg-surface-container-high hover:bg-secondary/20 text-on-surface-variant hover:text-secondary transition-all cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[18px]">key</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal: Añadir Usuario (+ Añadir Usuario) */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#13151c] border border-white/10 rounded-2xl w-full max-w-lg p-space-lg shadow-[0_20px_60px_rgba(0,0,0,0.8)] flex flex-col gap-space-md animate-fade-in">
            <div className="flex items-center justify-between border-b border-white/10 pb-space-sm">
              <div className="flex items-center gap-space-sm">
                <div className="w-10 h-10 rounded-xl bg-primary text-black flex items-center justify-center shadow-[0_0_16px_rgba(102,252,241,0.4)]">
                  <span className="material-symbols-outlined text-[24px]">person_add</span>
                </div>
                <div>
                  <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">
                    {lang === 'es' ? 'Alta de Nuevo Agente' : 'Add New Agent'}
                  </h3>
                  <span className="font-label-code text-xs text-on-surface-variant">
                    {lang === 'es' ? 'Generación automática de extensión SIP WebRTC' : 'Automatic WebRTC SIP Extension Provisioning'}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-on-surface-variant hover:text-white p-1 rounded-lg hover:bg-surface-container cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-space-md">
              <div>
                <label className="font-label-code text-xs text-on-surface-variant block mb-1">
                  {lang === 'es' ? 'Nombre Completo' : 'Full Name'} *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Rodrigo Fernández"
                  value={newUserData.name}
                  onChange={(e) => setNewUserData({ ...newUserData, name: e.target.value })}
                  className="w-full bg-surface-container-high text-on-surface px-space-md py-2 rounded-xl text-body-sm focus:outline-none focus:ring-1 focus:ring-primary border border-white/10"
                />
              </div>

              <div>
                <label className="font-label-code text-xs text-on-surface-variant block mb-1">
                  {lang === 'es' ? 'Correo Corporativo' : 'Corporate Email'} *
                </label>
                <input
                  type="email"
                  required
                  placeholder="r.fernandez@vooxline.com"
                  value={newUserData.email}
                  onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                  className="w-full bg-surface-container-high text-on-surface px-space-md py-2 rounded-xl text-body-sm focus:outline-none focus:ring-1 focus:ring-primary border border-white/10"
                />
              </div>

              <div className="grid grid-cols-2 gap-space-sm">
                <div>
                  <label className="font-label-code text-xs text-on-surface-variant block mb-1">
                    {lang === 'es' ? 'Nivel / Rango' : 'Level / Tier'}
                  </label>
                  <select
                    value={newUserData.level}
                    onChange={(e) => setNewUserData({ ...newUserData, level: e.target.value })}
                    className="w-full bg-surface-container-high text-on-surface px-space-sm py-2 rounded-xl text-xs font-body-sm focus:outline-none focus:ring-1 focus:ring-primary border border-white/10"
                  >
                    <option value="Support Rep L1">Support Rep L1</option>
                    <option value="Senior Specialist L2">Senior Specialist L2</option>
                    <option value="Lead Retención L3">Lead Retención L3</option>
                    <option value="QA Auditor">QA Auditor</option>
                  </select>
                </div>

                <div>
                  <label className="font-label-code text-xs text-on-surface-variant block mb-1">
                    {lang === 'es' ? 'Campaña Asignada' : 'Assigned Campaign'}
                  </label>
                  <select
                    value={newUserData.campaign}
                    onChange={(e) => setNewUserData({ ...newUserData, campaign: e.target.value })}
                    className="w-full bg-surface-container-high text-on-surface px-space-sm py-2 rounded-xl text-xs font-body-sm focus:outline-none focus:ring-1 focus:ring-primary border border-white/10"
                  >
                    <option value="National Assemblers Inc">National Assemblers Inc</option>
                    <option value="Fidelis Health Support">Fidelis Health Support</option>
                    <option value="NexPay Fintech VIP">NexPay Fintech VIP</option>
                    <option value="Retail Express VIP">Retail Express VIP</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-label-code text-xs text-on-surface-variant block mb-1">
                  {lang === 'es' ? 'Grupo de Trabajo' : 'Workgroup'}
                </label>
                <select
                  value={newUserData.workgroup}
                  onChange={(e) => setNewUserData({ ...newUserData, workgroup: e.target.value })}
                  className="w-full bg-surface-container-high text-on-surface px-space-sm py-2 rounded-xl text-xs font-body-sm focus:outline-none focus:ring-1 focus:ring-primary border border-white/10"
                >
                  <option value="Soporte Nivel 1">Soporte Nivel 1</option>
                  <option value="Retención & Ventas VIP">Retención & Ventas VIP</option>
                  <option value="QA & Compliance">QA & Compliance</option>
                  <option value="Supervisión de Nodos">Supervisión de Nodos</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-space-xs pt-space-xs border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-space-md py-2 rounded-xl bg-surface-container-high hover:bg-surface-variant text-on-surface font-label-tag text-xs cursor-pointer"
                >
                  {lang === 'es' ? 'Cancelar' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-space-md py-2 rounded-xl bg-primary text-black font-bold font-label-tag text-xs hover:brightness-110 shadow-[0_0_16px_rgba(102,252,241,0.4)] cursor-pointer"
                >
                  {lang === 'es' ? 'Crear y Habilitar SIP' : 'Create & Enable SIP'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
};
