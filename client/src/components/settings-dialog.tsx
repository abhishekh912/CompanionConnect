import { useAuth } from "@/hooks/use-auth";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Settings } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { userSettingsSchema, UserSettings } from "@shared/schema";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";

export default function SettingsDialog() {
  const { user } = useAuth();
  
  const form = useForm<UserSettings>({
    resolver: zodResolver(userSettingsSchema),
    defaultValues: {
      aiName: user?.aiName,
      wakeTime: user?.wakeTime,
      waterInterval: user?.waterInterval,
      useVoice: user?.useVoice,
    },
  });

  const settingsMutation = useMutation({
    mutationFn: async (data: UserSettings) => {
      const res = await apiRequest("PATCH", "/api/settings", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
    },
  });

  async function onSubmit(data: UserSettings) {
    await settingsMutation.mutateAsync(data);
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon">
          <Settings className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Companion Settings</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="aiName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>AI Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormDescription>
                    What would you like to call your AI companion?
                  </FormDescription>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="wakeTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Wake Time</FormLabel>
                  <FormControl>
                    <Input type="time" {...field} />
                  </FormControl>
                  <FormDescription>
                    When should your companion send you morning greetings?
                  </FormDescription>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="waterInterval"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Water Reminder Interval (minutes)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="30"
                      max="240"
                      {...field}
                      onChange={e => field.onChange(parseInt(e.target.value))}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="useVoice"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between">
                  <div>
                    <FormLabel>Voice Messages</FormLabel>
                    <FormDescription>
                      Enable voice messages for reminders
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <Button
              type="submit"
              className="w-full"
              disabled={settingsMutation.isPending}
            >
              Save Changes
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
