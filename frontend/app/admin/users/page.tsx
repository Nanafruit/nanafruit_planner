import Navbar from "../../components/navbar";
import { apiFetch } from "@/app/lib/api-client";
import type { UserRole } from "@/auth";
import RoleSelect from "./role-select";

interface UserRecord {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
}

async function getUsers(): Promise<UserRecord[]> {
  return (await apiFetch("/users")) as UserRecord[];
}

export default async function AdminUsersPage() {
  const users = await getUsers();

  return (
    <div className="flex flex-1 flex-col">
      <Navbar />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
        <h1 className="text-lg font-semibold text-zinc-900">จัดการผู้ใช้</h1>
        <p className="mt-1 text-sm text-zinc-500">
          กำหนด role ให้ผู้ใช้ในระบบ — admin เห็นและจัดการได้ทุกอย่าง, staff
          ใช้งานฟีเจอร์ทั่วไป
        </p>

        <div className="mt-6 overflow-hidden rounded-xl border border-zinc-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 text-xs font-medium uppercase text-zinc-500">
              <tr>
                <th className="px-4 py-3">ชื่อ</th>
                <th className="px-4 py-3">อีเมล</th>
                <th className="px-4 py-3">Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="px-4 py-3 text-zinc-800">
                    {user.name ?? "-"}
                  </td>
                  <td className="px-4 py-3 text-zinc-600">{user.email}</td>
                  <td className="px-4 py-3">
                    <RoleSelect userId={user.id} role={user.role} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
