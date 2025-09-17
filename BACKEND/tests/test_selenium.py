# BACKEND/tests/test_selenium.py
from django.test import LiveServerTestCase
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from webdriver_manager.chrome import ChromeDriverManager

class AdminLoginUITest(LiveServerTestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        opts = Options()
        # Quita headless si quieres ver el navegador:
        opts.add_argument("--headless=new")
        opts.add_argument("--window-size=1280,800")
        cls.driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=opts)
        cls.wait = WebDriverWait(cls.driver, 10)

    @classmethod
    def tearDownClass(cls):
        cls.driver.quit()
        super().tearDownClass()

    def test_admin_login_page_loads(self):
        self.driver.get(self.live_server_url + "/admin/login/")
        self.wait.until(EC.presence_of_element_located((By.NAME, "username")))
        # La página carga y muestra el formulario:
        self.assertTrue(self.driver.find_elements(By.NAME, "password"))

    def test_admin_login_wrong_credentials(self):
        self.driver.get(self.live_server_url + "/admin/login/")
        self.wait.until(EC.presence_of_element_located((By.NAME, "username"))).send_keys("bad")
        self.driver.find_element(By.NAME, "password").send_keys("bad")
        self.driver.find_element(By.CSS_SELECTOR, "input[type=submit]").click()
        # Debe aparecer el mensaje de error (elemento con clase errornote)
        self.wait.until(EC.presence_of_element_located((By.CLASS_NAME, "errornote")))
        self.assertTrue(self.driver.find_elements(By.CLASS_NAME, "errornote"))
