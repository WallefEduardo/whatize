import api from "./api";

const request = async (options) => {
  const { url, method, data, params } = options;
  
  const response = await api({
    url,
    method,
    data,
    params,
  });
  
  return response.data;
};

// CRUD das Tarefas
export const ListTasks = async (params = {}) => {
  return request({
    url: "/tasks",
    method: "GET",
    params
  });
};

export const ShowTask = async (taskId) => {
  return request({
    url: `/tasks/${taskId}`,
    method: "GET"
  });
};

export const CreateTask = async (data) => {
  return request({
    url: "/tasks",
    method: "POST",
    data
  });
};

export const UpdateTask = async (taskId, data) => {
  return request({
    url: `/tasks/${taskId}`,
    method: "PUT",
    data
  });
};

export const DeleteTask = async (taskId) => {
  return request({
    url: `/tasks/${taskId}`,
    method: "DELETE"
  });
};

// Endpoints extras
export const GetTaskStats = async () => {
  return request({
    url: "/tasks/stats",
    method: "GET"
  });
};

export const GetMyTasks = async (params = {}) => {
  return request({
    url: "/tasks/my-tasks",
    method: "GET",
    params
  });
};

export const GetOverdueTasks = async (params = {}) => {
  return request({
    url: "/tasks/overdue",
    method: "GET",
    params
  });
};