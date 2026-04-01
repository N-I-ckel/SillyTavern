{{/*
Common labels
*/}}
{{- define "agent-platform.labels" -}}
helm.sh/chart: {{ .Chart.Name }}-{{ .Chart.Version }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
app.kubernetes.io/part-of: agent-platform
{{- end }}

{{/*
Selector labels
*/}}
{{- define "agent-platform.selectorLabels" -}}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
Namespace
*/}}
{{- define "agent-platform.namespace" -}}
{{ .Release.Namespace | default "agent-platform" }}
{{- end }}
