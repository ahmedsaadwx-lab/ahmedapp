// ========== التهيئة والإعدادات ==========
let savedReports = JSON.parse(localStorage.getItem('clubReports')) || [];
let notificationTimeout;
let confettiAvailable = false;

// التحقق من وجود مكتبة confetti
if (typeof confetti === 'function') {
    confettiAvailable = true;
}

// تهيئة المكتبات
document.addEventListener('DOMContentLoaded', function() {
    // تهيئة AOS للأنيميشن - التحقق من وجود المكتبة
    if (typeof AOS !== 'undefined') {
        AOS.init({
            duration: 1000,
            once: true,
            offset: 100
        });
    }

    // إخفاء شاشة التحميل
    setTimeout(() => {
        const loader = document.querySelector('.loader-wrapper');
        if (loader) {
            loader.style.opacity = '0';
            setTimeout(() => {
                loader.style.display = 'none';
            }, 500);
        }
    }, 1000);

    // تحديث التاريخ والوقت
    updateDateTime();
    setInterval(updateDateTime, 1000);

    // عرض التقارير المحفوظة
    displayReports();
    
    // حساب القيم الأولية
    calculateAll();
    
    // إضافة مستمعي الأحداث للبحث والفرز
    const searchInput = document.getElementById('searchReport');
    const sortSelect = document.getElementById('sortReports');
    
    if (searchInput) {
        searchInput.addEventListener('input', filterReports);
    }
    
    if (sortSelect) {
        sortSelect.addEventListener('change', filterReports);
    }
});

// ========== تحديث التاريخ والوقت ==========
function updateDateTime() {
    const now = new Date();
    const dateOptions = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    };
    const timeOptions = { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit',
        hour12: true 
    };
    
    const dateElement = document.getElementById('currentDate');
    const timeElement = document.getElementById('currentTime');
    const reportsCountElement = document.getElementById('reportsCount');
    
    if (dateElement) {
        dateElement.textContent = now.toLocaleDateString('ar-IQ', dateOptions);
    }
    
    if (timeElement) {
        timeElement.textContent = now.toLocaleTimeString('ar-IQ', timeOptions);
    }
    
    if (reportsCountElement) {
        reportsCountElement.textContent = `${savedReports.length} تقرير`;
    }
}

// ========== نظام الإشعارات ==========
function showNotification(title, message, type = 'success') {
    // إزالة الإشعار السابق
    if (notificationTimeout) {
        clearTimeout(notificationTimeout);
    }
    
    // إزالة أي إشعارات موجودة
    document.querySelectorAll('.notification').forEach(n => n.remove());

    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    let icon = 'check-circle';
    if (type === 'error') icon = 'exclamation-circle';
    if (type === 'warning') icon = 'exclamation-triangle';
    
    notification.innerHTML = `
        <i class="fas fa-${icon}"></i>
        <div class="notification-content">
            <div class="notification-title">${title}</div>
            <div class="notification-message">${message}</div>
        </div>
        <button class="notification-close" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    document.body.appendChild(notification);
    
    // إخفاء الإشعار بعد 5 ثواني
    notificationTimeout = setTimeout(() => {
        const notif = document.querySelector('.notification');
        if (notif) notif.remove();
    }, 5000);
}

// ========== وظائف الحساب ==========
function calculateAll() {
    try {
        // الحصول على قيم الأوزان
        const values = {
            meatPan: parseFloat(document.getElementById('meatPan')?.value) || 0,
            chickenPan: parseFloat(document.getElementById('chickenPan')?.value) || 0,
            burger: parseFloat(document.getElementById('burger')?.value) || 0,
            zinger: parseFloat(document.getElementById('zinger')?.value) || 0,
            falafel: parseFloat(document.getElementById('falafel')?.value) || 0,
            blackMeat: parseFloat(document.getElementById('blackMeat')?.value) || 0,
            potato: parseFloat(document.getElementById('potato')?.value) || 0,
            tomato: parseFloat(document.getElementById('tomato')?.value) || 0,
            sajBread: parseInt(document.getElementById('sajBread')?.value) || 0,
            stoneBread: parseInt(document.getElementById('stoneBread')?.value) || 0,
            roundBread: parseInt(document.getElementById('roundBread')?.value) || 0,
            soda: parseInt(document.getElementById('soda')?.value) || 0,
            money: parseFloat(document.getElementById('money')?.value) || 0,
            pansCount: parseInt(document.getElementById('pansCount')?.value) || 1
        };

        // حساب المجاميع
        const totals = {
            chicken: values.chickenPan + values.zinger,
            meat: values.meatPan + values.burger + values.blackMeat,
            bread: values.sajBread + values.stoneBread + values.roundBread,
            drinks: values.soda,
            vegetables: values.potato + values.tomato,
            falafel: values.falafel
        };

        // حساب التقسيم
        const perPan = {
            meat: values.pansCount > 0 ? totals.meat / values.pansCount : 0,
            chicken: values.pansCount > 0 ? totals.chicken / values.pansCount : 0
        };

        // حساب النسب
        const ratio = totals.chicken > 0 ? (totals.meat / totals.chicken * 100).toFixed(2) : 0;

        // تحديث واجهة المستخدم
        updateDisplay(totals, perPan, ratio, values);
        
        // حفظ آخر القيم المحسوبة
        window.lastCalculated = {
            ...totals,
            meatPerPan: perPan.meat,
            chickenPerPan: perPan.chicken,
            ratio: ratio,
            money: values.money,
            date: new Date().toISOString(),
            pansCount: values.pansCount
        };

    } catch (error) {
        console.error('خطأ في الحساب:', error);
        showNotification('خطأ', 'حدث خطأ أثناء الحساب', 'error');
    }
}

function updateDisplay(totals, perPan, ratio, values) {
    // تحديث الإحصائيات
    const totalChickenEl = document.getElementById('totalChicken');
    const totalMeatEl = document.getElementById('totalMeat');
    const totalBreadEl = document.getElementById('totalBread');
    const totalDrinksEl = document.getElementById('totalDrinks');
    const meatPerPanEl = document.getElementById('meatPerPan');
    const chickenPerPanEl = document.getElementById('chickenPerPan');
    const ratioEl = document.getElementById('meatToChickenRatio');
    
    if (totalChickenEl) totalChickenEl.textContent = totals.chicken.toFixed(2);
    if (totalMeatEl) totalMeatEl.textContent = totals.meat.toFixed(2);
    if (totalBreadEl) totalBreadEl.textContent = totals.bread;
    if (totalDrinksEl) totalDrinksEl.textContent = totals.drinks;
    if (meatPerPanEl) meatPerPanEl.textContent = perPan.meat.toFixed(2);
    if (chickenPerPanEl) chickenPerPanEl.textContent = perPan.chicken.toFixed(2);
    if (ratioEl) ratioEl.textContent = ratio;
    
    // تحديث بطاقة الخردة بشكل مرئي
    const moneyElement = document.getElementById('money');
    if (moneyElement) {
        moneyElement.style.transition = 'all 0.3s ease';
        moneyElement.style.backgroundColor = '#f0f4ff';
        setTimeout(() => {
            moneyElement.style.backgroundColor = '';
        }, 300);
    }
}

// ========== وظائف التقارير ==========
function saveReport() {
    try {
        // التأكد من وجود بيانات محسوبة
        if (!window.lastCalculated) {
            calculateAll();
        }

        const report = {
            id: Date.now(),
            ...window.lastCalculated,
            timestamp: new Date().toISOString(),
            formattedDate: new Date().toLocaleString('ar-IQ', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            })
        };

        // إضافة التقرير
        savedReports.push(report);
        
        // حفظ في localStorage
        localStorage.setItem('clubReports', JSON.stringify(savedReports));
        
        // تحديث العرض
        displayReports();
        updateDateTime();
        
        // إظهار إشعار
        showNotification('تم الحفظ', 'تم حفظ التقرير بنجاح', 'success');
        
        // تأثير احتفالي (إذا كانت المكتبة متوفرة)
        if (confettiAvailable) {
            celebrate();
        }

    } catch (error) {
        console.error('خطأ في حفظ التقرير:', error);
        showNotification('خطأ', 'فشل حفظ التقرير', 'error');
    }
}

function displayReports(filteredReports = savedReports) {
    const reportsGrid = document.getElementById('reportsGrid');
    if (!reportsGrid) return;

    if (!filteredReports || filteredReports.length === 0) {
        reportsGrid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-folder-open fa-3x"></i>
                <p>لا توجد تقارير محفوظة</p>
                <button class="btn-modern btn-primary" onclick="generateSampleData()">
                    <i class="fas fa-magic"></i> إنشاء نموذج تجريبي
                </button>
            </div>
        `;
        return;
    }

    reportsGrid.innerHTML = filteredReports.map(report => `
        <div class="report-card" data-id="${report.id}">
            <div class="report-date">
                <i class="far fa-calendar-alt"></i> ${report.formattedDate || new Date(report.date).toLocaleString('ar-IQ')}
            </div>
            <div class="report-details">
                <div class="report-detail-item">
                    <span class="label"><i class="fas fa-drumstick-bite"></i> الدجاج:</span>
                    <span class="value">${(report.chicken || 0).toFixed(2)} كغم</span>
                </div>
                <div class="report-detail-item">
                    <span class="label"><i class="fas fa-utensils"></i> اللحوم:</span>
                    <span class="value">${(report.meat || 0).toFixed(2)} كغم</span>
                </div>
                <div class="report-detail-item">
                    <span class="label"><i class="fas fa-bread-slice"></i> الخبز:</span>
                    <span class="value">${report.bread || 0} رغيف</span>
                </div>
                <div class="report-detail-item">
                    <span class="label"><i class="fas fa-coins"></i> الخردة:</span>
                    <span class="value">${(report.money || 0).toLocaleString()} د.ع</span>
                </div>
                <div class="report-detail-item highlight">
                    <span class="label">اللحم/صاجية:</span>
                    <span class="value">${(report.meatPerPan || 0).toFixed(2)} كغم</span>
                </div>
                <div class="report-detail-item highlight">
                    <span class="label">الدجاج/صاجية:</span>
                    <span class="value">${(report.chickenPerPan || 0).toFixed(2)} كغم</span>
                </div>
            </div>
            <div class="report-actions">
                <button class="report-btn print" onclick="printSingleReport(${report.id})">
                    <i class="fas fa-print"></i> طباعة
                </button>
                <button class="report-btn delete" onclick="deleteReport(${report.id})">
                    <i class="fas fa-trash"></i> حذف
                </button>
            </div>
        </div>
    `).join('');
}

// ========== وظائف البحث والفرز ==========
function filterReports() {
    const searchInput = document.getElementById('searchReport');
    const sortSelect = document.getElementById('sortReports');
    
    if (!searchInput || !sortSelect) return;
    
    const searchTerm = searchInput.value.toLowerCase();
    const sortType = sortSelect.value;
    
    let filtered = savedReports.filter(report => {
        const reportStr = JSON.stringify(report).toLowerCase();
        return reportStr.includes(searchTerm);
    });
    
    // ترتيب النتائج
    switch(sortType) {
        case 'dateDesc':
            filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
            break;
        case 'dateAsc':
            filtered.sort((a, b) => new Date(a.date) - new Date(b.date));
            break;
        case 'moneyDesc':
            filtered.sort((a, b) => (b.money || 0) - (a.money || 0));
            break;
        case 'moneyAsc':
            filtered.sort((a, b) => (a.money || 0) - (b.money || 0));
            break;
        default:
            filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
    }
    
    displayReports(filtered);
}

// ========== وظائف الحذف ==========
function deleteReport(id) {
    if (confirm('هل أنت متأكد من حذف هذا التقرير؟')) {
        savedReports = savedReports.filter(r => r.id !== id);
        localStorage.setItem('clubReports', JSON.stringify(savedReports));
        displayReports();
        updateDateTime();
        showNotification('تم الحذف', 'تم حذف التقرير بنجاح', 'warning');
    }
}

function deleteAllReports() {
    if (confirm('هل أنت متأكد من حذف جميع التقارير؟ لا يمكن التراجع عن هذا الإجراء')) {
        savedReports = [];
        localStorage.setItem('clubReports', JSON.stringify(savedReports));
        displayReports();
        updateDateTime();
        showNotification('تم الحذف', 'تم حذف جميع التقارير', 'warning');
    }
}

// ========== وظائف التصدير والطباعة ==========
function exportToExcel() {
    try {
        // التحقق من وجود مكتبة XLSX
        if (typeof XLSX === 'undefined') {
            showNotification('خطأ', 'مكتبة Excel غير متوفرة', 'error');
            return;
        }
        
        if (savedReports.length === 0) {
            showNotification('تحذير', 'لا توجد تقارير للتصدير', 'warning');
            return;
        }
        
        const ws = XLSX.utils.json_to_sheet(savedReports.map(r => ({
            'التاريخ': r.formattedDate || new Date(r.date).toLocaleString('ar-IQ'),
            'إجمالي الدجاج (كغم)': (r.chicken || 0).toFixed(2),
            'إجمالي اللحوم (كغم)': (r.meat || 0).toFixed(2),
            'إجمالي الخبز': r.bread || 0,
            'المشروبات': r.drinks || 0,
            'الخردة (د.ع)': (r.money || 0).toLocaleString(),
            'لحم/صاجية': (r.meatPerPan || 0).toFixed(2),
            'دجاج/صاجية': (r.chickenPerPan || 0).toFixed(2),
            'النسبة %': r.ratio || 0
        })));
        
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "التقارير");
        
        const fileName = `تقارير_النوادي_${new Date().toLocaleDateString('ar-IQ').replace(/\//g, '-')}.xlsx`;
        XLSX.writeFile(wb, fileName);
        
        showNotification('تصدير ناجح', 'تم تصدير التقارير إلى Excel', 'success');
    } catch (error) {
        console.error('خطأ في التصدير:', error);
        showNotification('خطأ', 'فشل تصدير التقارير', 'error');
    }
}

function printReport() {
    if (savedReports.length === 0) {
        showNotification('تحذير', 'لا توجد تقارير للطباعة', 'warning');
        return;
    }
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html dir="rtl">
        <head>
            <title>تقرير النوادي</title>
            <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700&display=swap" rel="stylesheet">
            <style>
                body { 
                    font-family: 'Cairo', sans-serif; 
                    padding: 20px; 
                    background: #f7fafc;
                }
                h1 { 
                    color: #667eea; 
                    text-align: center;
                    margin-bottom: 30px;
                }
                .date { 
                    text-align: center; 
                    color: #666; 
                    margin-bottom: 30px;
                }
                table { 
                    width: 100%; 
                    border-collapse: collapse; 
                    margin-top: 20px;
                    background: white;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }
                th { 
                    background: #667eea; 
                    color: white; 
                    padding: 12px;
                    font-weight: 600;
                }
                td { 
                    border: 1px solid #ddd; 
                    padding: 10px; 
                    text-align: center;
                }
                tr:nth-child(even) {
                    background: #f8f9fa;
                }
                .footer { 
                    margin-top: 30px; 
                    text-align: center; 
                    color: #666;
                    font-size: 0.9rem;
                }
                .summary {
                    background: white;
                    padding: 20px;
                    border-radius: 10px;
                    margin-bottom: 20px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }
            </style>
        </head>
        <body>
            <h1>تقرير نوادي جامعة واسط</h1>
            <div class="date">التاريخ: ${new Date().toLocaleString('ar-IQ')}</div>
            
            <div class="summary">
                <h3>ملخص سريع</h3>
                <p>إجمالي التقارير: ${savedReports.length}</p>
                <p>إجمالي الخردة: ${savedReports.reduce((sum, r) => sum + (r.money || 0), 0).toLocaleString()} د.ع</p>
                <p>متوسط الدجاج: ${(savedReports.reduce((sum, r) => sum + (r.chicken || 0), 0) / savedReports.length).toFixed(2)} كغم</p>
                <p>متوسط اللحوم: ${(savedReports.reduce((sum, r) => sum + (r.meat || 0), 0) / savedReports.length).toFixed(2)} كغم</p>
            </div>
            
            <table>
                <thead>
                    <tr>
                        <th>التاريخ</th>
                        <th>الدجاج (كغم)</th>
                        <th>اللحوم (كغم)</th>
                        <th>الخبز</th>
                        <th>الخردة (د.ع)</th>
                    </tr>
                </thead>
                <tbody>
                    ${savedReports.slice(0, 20).map(r => `
                        <tr>
                            <td>${r.formattedDate || new Date(r.date).toLocaleDateString('ar-IQ')}</td>
                            <td>${(r.chicken || 0).toFixed(2)}</td>
                            <td>${(r.meat || 0).toFixed(2)}</td>
                            <td>${r.bread || 0}</td>
                            <td>${(r.money || 0).toLocaleString()}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            <div class="footer">
                <p>تم التوليد بواسطة برنامج بيانات نوادي جامعة واسط</p>
                <p>المالك: محمد الكعبي | المصمم: أحمد سعد</p>
            </div>
        </body>
        </html>
    `);
    printWindow.document.close();
    printWindow.print();
}

function printSingleReport(id) {
    const report = savedReports.find(r => r.id === id);
    if (!report) return;
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html dir="rtl">
        <head>
            <title>تقرير مفصل</title>
            <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700&display=swap" rel="stylesheet">
            <style>
                body { 
                    font-family: 'Cairo', sans-serif; 
                    padding: 40px; 
                    background: white;
                }
                .report-header { 
                    text-align: center; 
                    margin-bottom: 40px; 
                }
                .report-header h1 { 
                    color: #667eea;
                    font-size: 28px;
                    margin-bottom: 10px;
                }
                .report-header p {
                    color: #666;
                    font-size: 16px;
                }
                .details { 
                    max-width: 600px; 
                    margin: 0 auto; 
                    background: #f8f9fa;
                    padding: 30px;
                    border-radius: 15px;
                    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                }
                .detail-row { 
                    display: flex; 
                    justify-content: space-between; 
                    padding: 12px; 
                    border-bottom: 1px solid #dee2e6;
                }
                .detail-row:last-child {
                    border-bottom: none;
                }
                .label { 
                    font-weight: bold; 
                    color: #495057; 
                }
                .value { 
                    color: #667eea; 
                    font-weight: bold; 
                    font-size: 1.1rem;
                }
                .highlight-row {
                    background: #e9ecef;
                    border-radius: 8px;
                    margin: 10px 0;
                }
                .footer { 
                    margin-top: 50px; 
                    text-align: center; 
                    color: #868e96;
                    font-size: 14px;
                }
                .watermark {
                    position: fixed;
                    bottom: 20px;
                    left: 20px;
                    opacity: 0.1;
                    font-size: 50px;
                    color: #667eea;
                    transform: rotate(-15deg);
                    pointer-events: none;
                }
            </style>
        </head>
        <body>
            <div class="watermark">نوادي جامعة واسط</div>
            <div class="report-header">
                <h1>تقرير مفصل - نوادي جامعة واسط</h1>
                <p>${report.formattedDate || new Date(report.date).toLocaleString('ar-IQ')}</p>
            </div>
            <div class="details">
                <div class="detail-row">
                    <span class="label">🐔 إجمالي الدجاج:</span>
                    <span class="value">${(report.chicken || 0).toFixed(2)} كغم</span>
                </div>
                <div class="detail-row">
                    <span class="label">🥩 إجمالي اللحوم:</span>
                    <span class="value">${(report.meat || 0).toFixed(2)} كغم</span>
                </div>
                <div class="detail-row">
                    <span class="label">🥖 إجمالي الخبز:</span>
                    <span class="value">${report.bread || 0} رغيف</span>
                </div>
                <div class="detail-row">
                    <span class="label">🥤 المشروبات:</span>
                    <span class="value">${report.drinks || 0} قطعة</span>
                </div>
                <div class="detail-row">
                    <span class="label">🥗 الفلافل:</span>
                    <span class="value">${(report.falafel || 0).toFixed(2)} كغم</span>
                </div>
                <div class="detail-row">
                    <span class="label">🥔 الخضروات:</span>
                    <span class="value">${(report.vegetables || 0).toFixed(2)} كغم</span>
                </div>
                <div class="detail-row highlight-row">
                    <span class="label">💰 الخردة:</span>
                    <span class="value">${(report.money || 0).toLocaleString()} دينار عراقي</span>
                </div>
                <div class="detail-row highlight-row">
                    <span class="label">📊 اللحم لكل صاجية:</span>
                    <span class="value">${(report.meatPerPan || 0).toFixed(2)} كغم</span>
                </div>
                <div class="detail-row highlight-row">
                    <span class="label">📊 الدجاج لكل صاجية:</span>
                    <span class="value">${(report.chickenPerPan || 0).toFixed(2)} كغم</span>
                </div>
                <div class="detail-row">
                    <span class="label">📈 نسبة اللحم للدجاج:</span>
                    <span class="value">${report.ratio || 0}%</span>
                </div>
                <div class="detail-row">
                    <span class="label">🔢 عدد الصاجيات:</span>
                    <span class="value">${report.pansCount || 1}</span>
                </div>
            </div>
            <div class="footer">
                <p>تم التوليد بواسطة برنامج بيانات نوادي جامعة واسط</p>
                <p>المالك: محمد الكعبي | المصمم: أحمد سعد</p>
                <p>جميع الحقوق محفوظة © 2024</p>
            </div>
        </body>
        </html>
    `);
    printWindow.document.close();
    printWindow.print();
}

// ========== وظائف إضافية ==========
function resetForm() {
    if (confirm('هل تريد إعادة حساب القيم؟')) {
        calculateAll();
        showNotification('تم', 'تم تحديث الحسابات', 'success');
    }
}

function clearAll() {
    if (confirm('هل أنت متأكد من مسح جميع البيانات؟')) {
        document.querySelectorAll('input').forEach(input => {
            if (input) input.value = '0';
        });
        calculateAll();
        showNotification('تم المسح', 'تم مسح جميع البيانات', 'warning');
    }
}

function scrollToSection(sectionId) {
    const element = document.getElementById(sectionId);
    if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
    }
}

function toggleCard(contentId) {
    const content = document.getElementById(contentId);
    const icon = event?.currentTarget?.querySelector('i');
    
    if (content) {
        if (content.style.display === 'none') {
            content.style.display = 'block';
            if (icon) icon.className = 'fas fa-chevron-up';
        } else {
            content.style.display = 'none';
            if (icon) icon.className = 'fas fa-chevron-down';
        }
    }
}

function generateSampleData() {
    const sampleReports = [
        {
            id: Date.now() - 3 * 24 * 60 * 60 * 1000,
            date: new Date(2024, 0, 15, 10, 30).toISOString(),
            formattedDate: '١٥ يناير ٢٠٢٤ ١٠:٣٠ ص',
            chicken: 45.5,
            meat: 62.3,
            bread: 120,
            drinks: 45,
            money: 750000,
            meatPerPan: 15.575,
            chickenPerPan: 11.375,
            ratio: 136.8,
            pansCount: 4,
            falafel: 8.5,
            vegetables: 25.3
        },
        {
            id: Date.now() - 2 * 24 * 60 * 60 * 1000,
            date: new Date(2024, 0, 16, 11, 15).toISOString(),
            formattedDate: '١٦ يناير ٢٠٢٤ ١١:١٥ ص',
            chicken: 52.0,
            meat: 58.5,
            bread: 135,
            drinks: 52,
            money: 820000,
            meatPerPan: 14.625,
            chickenPerPan: 13.0,
            ratio: 112.5,
            pansCount: 4,
            falafel: 10.2,
            vegetables: 30.5
        },
        {
            id: Date.now() - 1 * 24 * 60 * 60 * 1000,
            date: new Date(2024, 0, 17, 9, 45).toISOString(),
            formattedDate: '١٧ يناير ٢٠٢٤ ٩:٤٥ ص',
            chicken: 38.2,
            meat: 45.8,
            bread: 98,
            drinks: 38,
            money: 580000,
            meatPerPan: 11.45,
            chickenPerPan: 9.55,
            ratio: 119.9,
            pansCount: 4,
            falafel: 7.8,
            vegetables: 22.4
        }
    ];
    
    savedReports = sampleReports;
    localStorage.setItem('clubReports', JSON.stringify(savedReports));
    displayReports();
    updateDateTime();
    showNotification('تم', 'تم إنشاء بيانات تجريبية', 'success');
}

function celebrate() {
    if (!confettiAvailable) return;
    
    const duration = 1000;
    const end = Date.now() + duration;
    
    const frame = () => {
        try {
            confetti({
                particleCount: 3,
                angle: 60,
                spread: 55,
                origin: { x: 0 }
            });
            confetti({
                particleCount: 3,
                angle: 120,
                spread: 55,
                origin: { x: 1 }
            });
        } catch (e) {
            console.log('Confetti error:', e);
        }
        
        if (Date.now() < end) {
            requestAnimationFrame(frame);
        }
    };
    
    frame();
}

// ========== حفظ الحالة قبل إغلاق الصفحة ==========
window.addEventListener('beforeunload', function() {
    // حفظ آخر حالة إذا لزم الأمر
    const currentState = {
        inputs: {},
        lastCalculated: window.lastCalculated
    };
    
    document.querySelectorAll('input').forEach(input => {
        if (input && input.id) {
            currentState.inputs[input.id] = input.value;
        }
    });
    
    sessionStorage.setItem('lastState', JSON.stringify(currentState));
});

// ========== استعادة الحالة عند تحميل الصفحة ==========
window.addEventListener('load', function() {
    const savedState = sessionStorage.getItem('lastState');
    if (savedState) {
        try {
            const state = JSON.parse(savedState);
            if (state.inputs) {
                Object.entries(state.inputs).forEach(([id, value]) => {
                    const input = document.getElementById(id);
                    if (input) input.value = value;
                });
            }
            calculateAll();
        } catch (e) {
            console.log('لا توجد حالة سابقة');
        }
    }
});