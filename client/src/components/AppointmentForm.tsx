import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, Clock, User, Scissors } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface AppointmentFormProps {
  onSuccess?: () => void;
}

export function AppointmentForm({ onSuccess }: AppointmentFormProps) {
  const [formData, setFormData] = useState({
    service: "Haircut",
    duration: 30,
    scheduledAt: new Date().toISOString().split("T")[0],
    scheduledTime: "10:00",
    barberName: "",
    notes: "",
  });

  const createAppointmentMutation = trpc.appointments.create.useMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const [year, month, day] = formData.scheduledAt.split("-");
      const [hours, minutes] = formData.scheduledTime.split(":");
      const scheduledAt = new Date(
        parseInt(year),
        parseInt(month) - 1,
        parseInt(day),
        parseInt(hours),
        parseInt(minutes)
      );

      await createAppointmentMutation.mutateAsync({
        service: formData.service,
        duration: formData.duration,
        scheduledAt,
        barberName: formData.barberName || undefined,
        notes: formData.notes || undefined,
      });

      toast.success("Agendamento confirmado com sucesso!");
      setFormData({
        service: "Haircut",
        duration: 30,
        scheduledAt: new Date().toISOString().split("T")[0],
        scheduledTime: "10:00",
        barberName: "",
        notes: "",
      });
      onSuccess?.();
    } catch (error) {
      toast.error("Erro ao criar agendamento. Tente novamente.");
      console.error("Error creating appointment:", error);
    }
  };

  return (
    <Card className="p-6 bg-white border-slate-200">
      <h3 className="text-lg font-semibold text-slate-900 mb-6">Agendar Corte</h3>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Service Selection */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2 text-slate-700 font-medium">
            <Scissors className="w-4 h-4 text-blue-600" />
            Tipo de Serviço
          </Label>
          <Select value={formData.service} onValueChange={(value) => setFormData({ ...formData, service: value })}>
            <SelectTrigger className="border-slate-300 focus:border-blue-500 focus:ring-blue-500">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Haircut">Corte de Cabelo</SelectItem>
              <SelectItem value="Beard Trim">Aparação de Barba</SelectItem>
              <SelectItem value="Full Service">Serviço Completo</SelectItem>
              <SelectItem value="Hair Wash">Lavagem de Cabelo</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Duration Selection */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2 text-slate-700 font-medium">
            <Clock className="w-4 h-4 text-blue-600" />
            Duração (minutos)
          </Label>
          <Select value={formData.duration.toString()} onValueChange={(value) => setFormData({ ...formData, duration: parseInt(value) })}>
            <SelectTrigger className="border-slate-300 focus:border-blue-500 focus:ring-blue-500">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="15">15 minutos</SelectItem>
              <SelectItem value="30">30 minutos</SelectItem>
              <SelectItem value="45">45 minutos</SelectItem>
              <SelectItem value="60">1 hora</SelectItem>
              <SelectItem value="90">1 hora 30 minutos</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Date Selection */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2 text-slate-700 font-medium">
            <Calendar className="w-4 h-4 text-blue-600" />
            Data
          </Label>
          <Input
            type="date"
            value={formData.scheduledAt}
            onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
            min={new Date().toISOString().split("T")[0]}
            className="border-slate-300 focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        {/* Time Selection */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2 text-slate-700 font-medium">
            <Clock className="w-4 h-4 text-blue-600" />
            Horário
          </Label>
          <Input
            type="time"
            value={formData.scheduledTime}
            onChange={(e) => setFormData({ ...formData, scheduledTime: e.target.value })}
            className="border-slate-300 focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        {/* Barber Name (Optional) */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2 text-slate-700 font-medium">
            <User className="w-4 h-4 text-blue-600" />
            Barbeiro (Opcional)
          </Label>
          <Input
            type="text"
            placeholder="Nome do barbeiro preferido"
            value={formData.barberName}
            onChange={(e) => setFormData({ ...formData, barberName: e.target.value })}
            className="border-slate-300 focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <Label className="text-slate-700 font-medium">Observações</Label>
          <Textarea
            placeholder="Alguma observação especial sobre o corte?"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className="border-slate-300 focus:border-blue-500 focus:ring-blue-500 resize-none"
            rows={3}
          />
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={createAppointmentMutation.isPending}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg transition-colors"
        >
          {createAppointmentMutation.isPending ? "Agendando..." : "Confirmar Agendamento"}
        </Button>
      </form>
    </Card>
  );
}