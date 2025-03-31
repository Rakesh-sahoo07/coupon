interface CouponEmailTemplateProps {
    couponCode: string;
    discount: string;
    organizationName: string;
    description: string;
    expiresAt: string;
    redeemUrl: string;
  }
  
  export function getCouponEmailTemplate(props: CouponEmailTemplateProps): string {
    const { couponCode, discount, organizationName, description, expiresAt, redeemUrl } = props;
  
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Your Loyalty Coupon</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background: linear-gradient(to right, #3A86FF, #33C3F0);
            padding: 20px;
            text-align: center;
            color: white;
            border-radius: 10px 10px 0 0;
          }
          .content {
            background-color: #f9f9f9;
            padding: 20px;
            border-left: 1px solid #ddd;
            border-right: 1px solid #ddd;
          }
          .coupon-box {
            background-color: white;
            border: 2px dashed #3A86FF;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
            margin-bottom: 20px;
          }
          .discount {
            font-size: 24px;
            font-weight: bold;
            color: #FF006E;
            margin-bottom: 10px;
          }
          .code {
            font-family: monospace;
            font-size: 20px;
            background-color: #f0f0f0;
            padding: 10px;
            border-radius: 5px;
            font-weight: bold;
            letter-spacing: 2px;
          }
          .expires {
            color: #777;
            margin-top: 15px;
            font-size: 14px;
          }
          .button {
            display: inline-block;
            background: linear-gradient(to right, #3A86FF, #33C3F0);
            color: white;
            text-decoration: none;
            padding: 12px 25px;
            border-radius: 5px;
            font-weight: bold;
            margin-top: 20px;
          }
          .button:hover {
            background: linear-gradient(to right, #2070E0, #20A5D0);
          }
          .footer {
            background-color: #f0f0f0;
            padding: 15px;
            text-align: center;
            font-size: 12px;
            color: #777;
            border-radius: 0 0 10px 10px;
            border-left: 1px solid #ddd;
            border-right: 1px solid #ddd;
            border-bottom: 1px solid #ddd;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Loyalty Coupon</h1>
            <p>Your special offer from ${organizationName}</p>
          </div>
          
          <div class="content">
            <h2>You've received a coupon!</h2>
            <p>${description}</p>
            
            <div class="coupon-box">
              <div class="discount">${discount}</div>
              <p>Use coupon code:</p>
              <div class="code">${couponCode}</div>
              <p class="expires">Valid until: ${expiresAt}</p>
            </div>
            
            <p>Click the button below to redeem your coupon:</p>
            <div style="text-align: center;">
              <a href="${redeemUrl}" class="button">Redeem Now</a>
            </div>
          </div>
          
          <div class="footer">
            <p>This email was sent by Loyalty Luminary.</p>
            <p>If you received this email by mistake, please ignore it.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }