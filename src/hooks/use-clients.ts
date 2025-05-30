"use client"

import { getClients } from "@/app/actions/clients"
import { getClientCommunications } from "@/app/actions/communications"
import { getClientProjects } from "@/app/actions/projects"
import { Client, Communication } from "@/types"
import { useQuery, useQueryClient } from "@tanstack/react-query"

export const CLIENTS_QUERY_KEY = ["clients"]

export function useClients(status: "ACTIVE" | "ARCHIVED" | "ALL" = "ACTIVE") {
  return useQuery({
    queryKey: [...CLIENTS_QUERY_KEY, status],
    queryFn: () => getClients(status),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })
}

export function useClient(clientId: string) {
  const queryClient = useQueryClient()
  
  return useQuery({
    queryKey: ["client", clientId],
    queryFn: async () => {
      // First try to get from clients cache (any status)
      const activeClients = queryClient.getQueryData<Client[]>([...CLIENTS_QUERY_KEY, "ACTIVE"])
      const archivedClients = queryClient.getQueryData<Client[]>([...CLIENTS_QUERY_KEY, "ARCHIVED"])
      const allCachedClients = queryClient.getQueryData<Client[]>([...CLIENTS_QUERY_KEY, "ALL"])
      
      // Check all cached client lists
      const cachedClient = activeClients?.find(client => client.id === clientId) ||
                          archivedClients?.find(client => client.id === clientId) ||
                          allCachedClients?.find(client => client.id === clientId)
      
      if (cachedClient) {
        return cachedClient
      }
      
      // If not in cache, fetch all clients (including archived) and update the cache
      const allClients = await getClients("ALL")
      
      // Update the all clients cache with fresh data
      queryClient.setQueryData([...CLIENTS_QUERY_KEY, "ALL"], allClients)
      
      // Return the specific client
      return allClients.find(client => client.id === clientId) || null
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    enabled: !!clientId,
    // Only refetch if we don't have the client in any cache
    refetchOnMount: () => {
      const activeClients = queryClient.getQueryData<Client[]>([...CLIENTS_QUERY_KEY, "ACTIVE"])
      const archivedClients = queryClient.getQueryData<Client[]>([...CLIENTS_QUERY_KEY, "ARCHIVED"])
      const allCachedClients = queryClient.getQueryData<Client[]>([...CLIENTS_QUERY_KEY, "ALL"])
      
      const cachedClient = activeClients?.find(client => client.id === clientId) ||
                          archivedClients?.find(client => client.id === clientId) ||
                          allCachedClients?.find(client => client.id === clientId)
      return !cachedClient
    },
  })
}

export function useClientCommunications(clientId: string) {
  return useQuery({
    queryKey: ["communications", clientId],
    queryFn: () => getClientCommunications(clientId),
    enabled: !!clientId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })
}

export function useClientProjects(clientId: string) {
  return useQuery({
    queryKey: ["client-projects", clientId],
    queryFn: () => getClientProjects(clientId),
    enabled: !!clientId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })
}

export function useInvalidateClients() {
  const queryClient = useQueryClient()
  
  return () => {
    queryClient.invalidateQueries({ queryKey: CLIENTS_QUERY_KEY })
    // Also invalidate individual client queries
    queryClient.invalidateQueries({ queryKey: ["client"] })
  }
}

export function useInvalidateCommunications() {
  const queryClient = useQueryClient()
  
  return async (clientId: string) => {
    await queryClient.invalidateQueries({ queryKey: ["communications", clientId] })
  }
}

export function useUpdateClientCache() {
  const queryClient = useQueryClient()
  
  return (updatedClient: Client) => {
    // Update the clients list cache
    queryClient.setQueryData<Client[]>(CLIENTS_QUERY_KEY, (oldClients) => {
      if (!oldClients) return [updatedClient]
      return oldClients.map(client => 
        client.id === updatedClient.id ? updatedClient : client
      )
    })
    
    // Update the individual client cache
    queryClient.setQueryData(["client", updatedClient.id], updatedClient)
  }
}

export function useRemoveClientFromCache() {
  const queryClient = useQueryClient()
  
  return (clientId: string) => {
    // Remove from clients list cache
    queryClient.setQueryData<Client[]>(CLIENTS_QUERY_KEY, (oldClients) => {
      if (!oldClients) return []
      return oldClients.filter(client => client.id !== clientId)
    })
    
    // Remove individual client cache
    queryClient.removeQueries({ queryKey: ["client", clientId] })
    // Also remove related data
    queryClient.removeQueries({ queryKey: ["communications", clientId] })
    queryClient.removeQueries({ queryKey: ["client-projects", clientId] })
  }
}

export function useUpdateCommunicationsCache() {
  const queryClient = useQueryClient()
  
  return {
    addCommunication: (clientId: string, newCommunication: Communication) => {
      // Add the new communication to the cache
      queryClient.setQueryData<Communication[]>(["communications", clientId], (oldComms) => {
        if (!oldComms) return [newCommunication]
        return [newCommunication, ...oldComms]
      })
    },
    removeCommunication: (clientId: string, communicationId: string) => {
      // Remove the communication from the cache
      queryClient.setQueryData<Communication[]>(["communications", clientId], (oldComms) => {
        if (!oldComms) return []
        return oldComms.filter(comm => comm.id !== communicationId)
      })
    }
  }
} 