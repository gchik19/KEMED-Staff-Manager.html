import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "../components/ui/dialog";

export function Ranks() {
  const { token, user } = useAuth();
  const [ranks, setRanks] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  const [name, setName] = useState("");
  const [category, setCategory] = useState("TEACHING_PROFESSIONAL");
  
  const [bulkData, setBulkData] = useState("");
  const [error, setError] = useState("");

  if (user?.role !== "SUPER_ADMIN" && user?.role !== "ADMIN") return <div>Access denied</div>;

  const fetchRanks = () => {
    fetch("/api/ranks", { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.json())
      .then(setRanks)
      .catch(() => {});
  };

  useEffect(() => {
    fetchRanks();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const url = editingId ? `/api/ranks/${editingId}` : "/api/ranks";
    const method = editingId ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name, category }),
    });

    if (res.ok) {
      setIsOpen(false);
      setName("");
      setEditingId(null);
      fetchRanks();
    } else {
      const err = await res.json();
      setError(err.error || "Failed to save");
    }
  };

  const handleBulkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    const rankList = bulkData.split("\n").map(r => r.trim()).filter(Boolean);
    if (rankList.length === 0) return setError("Please provide list of ranks");

    const res = await fetch("/api/ranks/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ ranks: rankList, category }),
    });

    if (res.ok) {
      setIsBulkOpen(false);
      setBulkData("");
      fetchRanks();
    } else {
      const err = await res.json();
      setError(err.error || "Failed to save");
    }
  };

  const categories = {
    TEACHING_PROFESSIONAL: "Teaching Staff (Professional)",
    TEACHING_NON_PROFESSIONAL: "Teaching Staff (Non-Professional)",
    NON_TEACHING: "Non-Teaching Staff"
  };

  return (
    <div className="space-y-6 lg:space-y-8 animate-in fade-in duration-500 pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
           <h2 className="text-3xl font-black tracking-tight text-slate-800">Staff Ranks</h2>
           <p className="text-slate-500 font-medium mt-1">Manage ranks for different staff categories</p>
        </div>
        {user?.role === "SUPER_ADMIN" && (
           <div className="flex gap-2 w-full sm:w-auto">
             <Button variant="outline" className="shadow-sm font-semibold tracking-wide flex-1 sm:flex-none border-[#004d40] text-[#004d40] hover:bg-[#004d40] hover:text-white" onClick={() => { setBulkData(""); setIsBulkOpen(true); setError(""); }}>
               Bulk Upload Ranks
             </Button>
             <Button className="bg-[#004d40] hover:bg-[#00332a] shadow-sm font-semibold tracking-wide flex-1 sm:flex-none" onClick={() => { setName(""); setEditingId(null); setIsOpen(true); setError(""); }}>
               Add Rank
             </Button>
           </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50/80 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 font-bold tracking-wider">Category</th>
                <th className="px-6 py-4 font-bold tracking-wider">Rank Name</th>
                {user?.role === "SUPER_ADMIN" && <th className="px-6 py-4 font-bold tracking-wider w-[200px]">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {ranks.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-600 bg-slate-50/50">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                       {categories[r.category as keyof typeof categories] || r.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-bold text-slate-800">{r.name}</td>
                  {user?.role === "SUPER_ADMIN" && (
                     <td className="px-6 py-4 flex items-center gap-2">
                       <Button variant="outline" size="sm" className="shadow-sm font-semibold" onClick={() => {
                           setName(r.name);
                           setCategory(r.category);
                           setEditingId(r.id);
                           setIsOpen(true);
                           setError("");
                       }}>Edit</Button>
                       <Button variant="destructive" size="sm" className="shadow-sm font-semibold" onClick={async () => {
                           if(!confirm("Delete rank?")) return;
                           const res = await fetch(`/api/ranks/${r.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` }});
                           if (res.ok) fetchRanks();
                       }}>Delete</Button>
                     </td>
                  )}
                </tr>
              ))}
              {ranks.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-slate-500 italic">No ranks configured yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Rank" : "Add Rank"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            {error && <div className="text-red-500 bg-red-50 text-sm p-3 rounded-md">{error}</div>}
             <div className="space-y-2">
               <Label>Category</Label>
               <select className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm" value={category} onChange={(e) => setCategory(e.target.value)}>
                 {Object.entries(categories).map(([k, v]) => (
                   <option key={k} value={k}>{v}</option>
                 ))}
               </select>
             </div>
            <div className="space-y-2">
              <Label>Rank Name <span className="text-red-500">*</span></Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} required placeholder="e.g. Principal Superintendent" />
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
              <Button type="button" onClick={handleSubmit} className="bg-[#004d40] hover:bg-[#00332a]">Save</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      <Dialog open={isBulkOpen} onOpenChange={setIsBulkOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Bulk Upload Ranks</DialogTitle>
            <DialogDescription>Paste a list of rank names (one per line) for a selected category.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleBulkSubmit} className="space-y-4 py-4">
            {error && <div className="text-red-500 bg-red-50 text-sm p-3 rounded-md">{error}</div>}
             <div className="space-y-2">
               <Label>Select Category</Label>
               <select className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm" value={category} onChange={(e) => setCategory(e.target.value)}>
                 {Object.entries(categories).map(([k, v]) => (
                   <option key={k} value={k}>{v}</option>
                 ))}
               </select>
             </div>
             <div className="space-y-2">
               <Label>Rank Names</Label>
               <textarea 
                  className="flex min-h-[150px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm" 
                  value={bulkData} 
                  onChange={(e) => setBulkData(e.target.value)} 
                  placeholder="Senior Superintendent I&#10;Principal Superintendent&#10;Assistant Director II"
                  required
                />
             </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsBulkOpen(false)}>Cancel</Button>
              <Button type="button" onClick={handleBulkSubmit} className="bg-[#004d40] hover:bg-[#00332a]">Import</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
