import { logout } from "@/app/actions";
import RefreshButton from "./RefreshButton";
import Image from "next/image";

interface ThingSpeakResponse {
  channel: {
    id: number;
    name: string;
    description: string;
  };
  feeds: Array<{
    created_at: string;
    entry_id: number;
    field1: string | null; // CO (PPM)
    field2: string | null; // Temperatura (°C)
    field3: string | null; // Umidade (%)
  }>;
}

async function getThingSpeakData(): Promise<ThingSpeakResponse | null> {
  const channelId = process.env.THINGSPEAK_CHANNEL_ID;
  const apiKey = process.env.THINGSPEAK_READ_API_KEY;

  if (!channelId) return null;

  try {
    const res = await fetch(
      `https://api.thingspeak.com/channels/${channelId}/feeds.json?api_key=${apiKey}&results=20`,
      { cache: "no-store" } // Garante que pegue os dados mais recentes sempre
    );
    
    if (!res.ok) {
      throw new Error("Falha ao buscar dados do ThingSpeak");
    }

    return res.json();
  } catch (error) {
    console.error(error);
    return null;
  }
}

export default async function DashboardPage() {
  const data = await getThingSpeakData();

  if (!data || !data.feeds) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center flex-col gap-4">
        <h1 className="text-xl">Erro ao carregar dados do ThingSpeak.</h1>
        <p className="text-gray-400">Verifique suas credenciais e conexão.</p>
        <form action={logout}>
          <button className="px-4 py-2 bg-red-600 rounded-lg hover:bg-red-700">Sair</button>
        </form>
      </div>
    );
  }

  const feeds = data.feeds.reverse(); // Os mais recentes primeiro
  const latestRead = feeds[0];

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("pt-BR", {
      timeZone: "America/Manaus", // Ou o fuso desejado, usando fuso local
    });
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 font-sans selection:bg-blue-500/30">
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image 
              src="/logo.png.jpeg" 
              alt="ARSENS Logo" 
              width={48}
              height={48}
              className="object-contain drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]"
            />
            <h1 className="text-xl font-semibold tracking-tight text-white">
              Monitoramento Ambiental
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
            <RefreshButton />
            <form action={logout}>
              <button
                type="submit"
                className="text-sm px-4 py-2 rounded-md bg-gray-800 hover:bg-gray-700 border border-gray-700 transition-colors text-gray-300 hover:text-white"
              >
                Logout
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Cards Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 shadow-lg relative overflow-hidden group hover:border-gray-700 transition-all">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl -mr-10 -mt-10 group-hover:bg-blue-500/10 transition-colors"></div>
            <p className="text-sm font-medium text-gray-400">Última Leitura</p>
            <p className="text-lg font-semibold text-white mt-2">
              {latestRead ? formatDateTime(latestRead.created_at) : "Sem dados"}
            </p>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 shadow-lg relative overflow-hidden group hover:border-orange-500/30 transition-all">
            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-full blur-2xl -mr-10 -mt-10 group-hover:bg-orange-500/10 transition-colors"></div>
            <p className="text-sm font-medium text-gray-400">Nível de CO</p>
            <div className="flex items-baseline gap-2 mt-2">
              <p className="text-3xl font-bold text-orange-400">
                {latestRead?.field1 ? Number(latestRead.field1).toFixed(1) : "--"}
              </p>
              <span className="text-sm text-gray-500">PPM</span>
            </div>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 shadow-lg relative overflow-hidden group hover:border-red-500/30 transition-all">
             <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full blur-2xl -mr-10 -mt-10 group-hover:bg-red-500/10 transition-colors"></div>
            <p className="text-sm font-medium text-gray-400">Temperatura</p>
            <div className="flex items-baseline gap-2 mt-2">
              <p className="text-3xl font-bold text-red-400">
                {latestRead?.field2 ? Number(latestRead.field2).toFixed(1) : "--"}
              </p>
              <span className="text-sm text-gray-500">°C</span>
            </div>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 shadow-lg relative overflow-hidden group hover:border-cyan-500/30 transition-all">
            <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-2xl -mr-10 -mt-10 group-hover:bg-cyan-500/10 transition-colors"></div>
            <p className="text-sm font-medium text-gray-400">Umidade</p>
            <div className="flex items-baseline gap-2 mt-2">
              <p className="text-3xl font-bold text-cyan-400">
                {latestRead?.field3 ? Number(latestRead.field3).toFixed(1) : "--"}
              </p>
              <span className="text-sm text-gray-500">%</span>
            </div>
          </div>
        </div>

        {/* Tabela de Histórico */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl shadow-lg overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-800">
            <h3 className="text-lg font-medium text-white">Histórico (Últimas 20 leituras)</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-950/50">
                  <th className="px-6 py-4 text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Data / Hora
                  </th>
                  <th className="px-6 py-4 text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Nível de CO (PPM)
                  </th>
                  <th className="px-6 py-4 text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Temperatura (°C)
                  </th>
                  <th className="px-6 py-4 text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Umidade (%)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {feeds.map((feed) => (
                  <tr key={feed.entry_id} className="hover:bg-gray-800/30 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {formatDateTime(feed.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-orange-200">
                      {feed.field1 ? Number(feed.field1).toFixed(2) : "--"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-red-200">
                      {feed.field2 ? Number(feed.field2).toFixed(2) : "--"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-cyan-200">
                      {feed.field3 ? Number(feed.field3).toFixed(2) : "--"}
                    </td>
                  </tr>
                ))}
                {feeds.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                      Nenhum registro encontrado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
