import base64
import requests
from django.conf import settings

APS_AUTH_URL = "https://developer.api.autodesk.com/authentication/v2/token"

class APSService:
    @staticmethod
    def get_auth_token(scopes: str = "viewables:read") -> dict:
        credentials = f"{settings.APS_CLIENT_ID}:{settings.APS_CLIENT_SECRET}"
        encoded = base64.b64encode(credentials.encode()).decode()

        response = requests.post(
            APS_AUTH_URL,
            headers={
                "Authorization": f"Basic {encoded}",
                "Content-Type":  "application/x-www-form-urlencoded",
            },
            data={
                "grant_type": "client_credentials",
                "scope":      scopes,
            },
            timeout=10,
        )
        
        if not response.ok:
            try:
                error_msg = response.json()
            except Exception:
                error_msg = response.text
            print(f"Error de Autodesk APS ({response.status_code}): {error_msg}")
            raise Exception(f"Fallo al autenticar en Autodesk APS. Detalles: {error_msg}")

        return response.json()

    @staticmethod
    def get_internal_token() -> dict:
        return APSService.get_auth_token(
            scopes="bucket:create bucket:read data:read data:write data:create"
        )

    @staticmethod
    def create_bucket_if_not_exists():
        token_data = APSService.get_internal_token()
        token = token_data["access_token"]
        bucket_key = settings.APS_BUCKET_KEY
        
        check_url = f"https://developer.api.autodesk.com/oss/v2/buckets/{bucket_key}/details"
        headers = {"Authorization": f"Bearer {token}"}
        res_check = requests.get(check_url, headers=headers)
        
        if res_check.status_code == 404:
            create_url = "https://developer.api.autodesk.com/oss/v2/buckets"
            payload = {
                "bucketKey": bucket_key,
                "policyKey": "persistent"
            }
            headers["Content-Type"] = "application/json"
            headers["x-ads-region"] = "US"
            res_create = requests.post(create_url, json=payload, headers=headers)
            
            if res_create.status_code != 200:
                raise Exception(f"Error al crear el bucket: {res_create.text}")
                
        elif res_check.status_code == 403:
            raise Exception(f"El bucket '{bucket_key}' ya está registrado. Cambia APS_BUCKET_KEY en tu .env.")

    @staticmethod
    def upload_file(file_obj, filename):
        """Subida moderna en 2 pasos usando Signed URLs de OSS."""
        APSService.create_bucket_if_not_exists()
        
        token_data = APSService.get_internal_token()
        token = token_data["access_token"]
        bucket_key = settings.APS_BUCKET_KEY
        
        # PASO 1: Solicitar URL firmada para subida (Signed URL)
        signed_url_endpoint = f"https://developer.api.autodesk.com/oss/v2/buckets/{bucket_key}/objects/{filename}/signeds3upload"
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
        # Pedimos URL para subir directamente
        res_signed = requests.get(signed_url_endpoint, headers=headers)
        
        if res_signed.status_code != 200:
            raise Exception(f"Error pidiendo URL firmada: {res_signed.text}")
            
        upload_data = res_signed.json()
        
        # El JSON contiene URLs para subir por partes.
        # Para archivos pequeños (como rac_basic_sample), usamos la primera URL.
        upload_urls = upload_data.get("urls", [])
        if not upload_urls:
            raise Exception("No se obtuvieron URLs de subida.")
            
        direct_upload_url = upload_urls[0]
        upload_key = upload_data.get("uploadKey")
        
        # PASO 2: Subir el archivo binario a la URL de Amazon S3 proveída por Autodesk
        file_data = file_obj.read()
        res_put = requests.put(direct_upload_url, data=file_data)
        
        if res_put.status_code not in (200, 202):
             raise Exception(f"S3 rechazó la subida: {res_put.text}")
             
        # PASO 3: Notificar a Autodesk que la subida terminó
        complete_endpoint = f"https://developer.api.autodesk.com/oss/v2/buckets/{bucket_key}/objects/{filename}/signeds3upload"
        payload = {
            "uploadKey": upload_key
        }
        res_complete = requests.post(complete_endpoint, json=payload, headers=headers)
        
        if res_complete.status_code != 200:
             raise Exception(f"Error al completar subida en OSS: {res_complete.text}")
             
        return res_complete.json()

    @staticmethod
    def translate_model(urn):
        token_data = APSService.get_internal_token()
        token = token_data["access_token"]
        
        url = "https://developer.api.autodesk.com/modelderivative/v2/designdata/job"
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
        payload = {
            "input": {
                "urn": urn
            },
            "output": {
                "formats": [
                    {
                        "type": "svf",
                        "views": ["2d", "3d"]
                    }
                ]
            }
        }
        res = requests.post(url, json=payload, headers=headers)
        res.raise_for_status()
        return res.json()

    @staticmethod
    def get_bucket_objects():
        APSService.create_bucket_if_not_exists()
        
        token_data = APSService.get_internal_token()
        token = token_data["access_token"]
        bucket_key = settings.APS_BUCKET_KEY
        
        url = f"https://developer.api.autodesk.com/oss/v2/buckets/{bucket_key}/objects"
        headers = {"Authorization": f"Bearer {token}"}
        
        res = requests.get(url, headers=headers)
        res.raise_for_status()
        return res.json()